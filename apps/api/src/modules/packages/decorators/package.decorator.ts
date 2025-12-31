import { SetMetadata } from '@nestjs/common';
import { FeatureKey, LimitKey } from '@greenpages/database';

export const CHECK_FEATURE_KEY = 'check_feature';
export const CheckFeature = (feature: FeatureKey) => SetMetadata(CHECK_FEATURE_KEY, feature);

export const CHECK_LIMIT_KEY = 'check_limit';
export const CheckLimit = (limit: LimitKey) => SetMetadata(CHECK_LIMIT_KEY, limit);
