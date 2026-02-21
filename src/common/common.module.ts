import { Global, Module } from '@nestjs/common';
import { ScopeGuard } from './guards/scope.guard';

@Global()
@Module({
  providers: [ScopeGuard],
  exports: [ScopeGuard],
})
export class CommonModule {}
