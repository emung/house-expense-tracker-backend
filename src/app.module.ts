import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticleModule } from './article/article.module';
import { AuthModule } from './auth/auth.module';
import { ContractorModule } from './contractor/contractor.module';
import { ExpenseModule } from './expense/expense.module';
import { SharedModule } from './shared/shared.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      // serveStaticOptions: {
      //   fallthrough: false,
      // },
    }),
    SharedModule,
    UserModule,
    AuthModule,
    ArticleModule,
    ExpenseModule,
    ContractorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
