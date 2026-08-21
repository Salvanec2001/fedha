import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ReportsService } from './reports.service';
import { formatMoney } from '../common/format-money';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  async summary(
    @CurrentUser() user: { userId: string },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.buildReport(user.userId, from, to);
  }

  @Get('pdf')
  async pdf(
    @CurrentUser() user: { userId: string },
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const report = await this.reportsService.buildReport(user.userId, from, to);
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="fedha-financial-report.pdf"');
    doc.pipe(res);

    doc.fontSize(20).fillColor('#0B1F3A').text('Fedha — Financial Report', { align: 'left' });
    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(
        `Period: ${report.period.from.toDateString()} to ${report.period.to.toDateString()}  ·  Generated ${new Date().toDateString()}`,
      );
    doc.moveDown(1.5);

    doc.fontSize(14).fillColor('#0B1F3A').text('Summary');
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#000000');
    doc.text(`Total balance across accounts: ${formatMoney(report.totalBalance, report.currency)}`);
    doc.text(`Total income (period): ${formatMoney(report.totalIncome, report.currency)}`);
    doc.text(`Total expenses (period): ${formatMoney(report.totalExpenses, report.currency)}`);
    doc.text(`Net cash flow: ${formatMoney(report.netCashFlow, report.currency)}`);
    doc.text(`Savings rate: ${report.savingsRate.toFixed(1)}%`);
    doc.moveDown(1);

    doc.fontSize(14).fillColor('#0B1F3A').text('Expenses by Category');
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#000000');
    if (report.categoryBreakdown.length === 0) {
      doc.text('No expenses recorded in this period.');
    }
    for (const c of report.categoryBreakdown) {
      doc.text(`${c.name}: ${formatMoney(c.total, report.currency)}`);
    }
    doc.moveDown(1);

    doc.fontSize(14).fillColor('#0B1F3A').text('Transactions');
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#000000');
    for (const t of report.transactions) {
      const sign = t.type === 'EXPENSE' ? '-' : t.type === 'INCOME' ? '+' : '';
      const desc = t.description || t.externalRecipientName || t.category?.name || t.type;
      doc.text(
        `${new Date(t.occurredAt).toLocaleDateString()}  ${t.type.padEnd(8)}  ${sign}${formatMoney(t.amount, t.currency)}  ${desc}`,
      );
    }

    doc.end();
  }

  @Get('excel')
  async excel(
    @CurrentUser() user: { userId: string },
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const report = await this.reportsService.buildReport(user.userId, from, to);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Fedha';
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [{ width: 30 }, { width: 20 }];
    summarySheet.addRows([
      ['Fedha — Financial Report'],
      [`Period`, `${report.period.from.toDateString()} — ${report.period.to.toDateString()}`],
      [],
      ['Total balance', report.totalBalance / 100],
      ['Total income', report.totalIncome / 100],
      ['Total expenses', report.totalExpenses / 100],
      ['Net cash flow', report.netCashFlow / 100],
      ['Savings rate (%)', Number(report.savingsRate.toFixed(1))],
    ]);
    summarySheet.getRow(1).font = { bold: true, size: 14 };

    const categorySheet = workbook.addWorksheet('By Category');
    categorySheet.columns = [
      { header: 'Category', key: 'name', width: 25 },
      { header: 'Group', key: 'group', width: 18 },
      { header: `Total (${report.currency})`, key: 'total', width: 18 },
    ];
    categorySheet.getRow(1).font = { bold: true };
    for (const c of report.categoryBreakdown) {
      categorySheet.addRow({ name: c.name, group: c.group, total: c.total / 100 });
    }

    const txSheet = workbook.addWorksheet('Transactions');
    txSheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Account', key: 'account', width: 20 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Description', key: 'description', width: 30 },
    ];
    txSheet.getRow(1).font = { bold: true };
    for (const t of report.transactions) {
      txSheet.addRow({
        date: new Date(t.occurredAt).toLocaleDateString(),
        type: t.type,
        amount: t.amount / 100,
        account: t.account?.name ?? '',
        category: t.category?.name ?? '',
        description: t.description || t.externalRecipientName || '',
      });
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="fedha-financial-report.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  }
}
