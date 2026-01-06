import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to get the current authenticated user or a specific property
 * Usage: @CurrentUser() user or @CurrentUser('id') userId
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
