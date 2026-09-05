import { Module } from '@nestjs/common';
import { SearchController } from './search.module';

@Module({
  controllers: [SearchController],
})
export class SearchModule {}
