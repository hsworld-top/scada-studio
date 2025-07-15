import { Module, Global } from '@nestjs/common';
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import * as path from 'path';

@Global()
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'zh',
      loaderOptions: {
        path: path.join(process.cwd(), 'libs/i18n-lib/i18n'),
        watch: true,
      },
      resolvers: [
        { use: AcceptLanguageResolver, options: { matchType: 'strict' } },
      ],
    }),
  ],
  exports: [I18nModule],
})
export class I18nLibModule {}
