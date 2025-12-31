class ApiEndpoints {
  // Base URL
  static const String baseUrl = 'http://localhost:3000/api';

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String me = '/auth/me';

  // Businesses
  static const String businesses = '/businesses';
  static String business(String id) => '/businesses/$id';
  static const String myBusinesses = '/businesses/my';
  static String updateBusiness(String id) => '/businesses/$id';
  static String deleteBusiness(String id) => '/businesses/$id';

  // Categories
  static const String categories = '/categories';
  static String category(String id) => '/categories/$id';

  // Governorates
  static const String governorates = '/governorates';
  static String governorate(String id) => '/governorates/$id';

  // Cities
  static const String cities = '/cities';
  static String city(String id) => '/cities/$id';
  static String citiesByGovernorate(String governorateId) =>
      '/governorates/$governorateId/cities';

  // Districts
  static const String districts = '/districts';
  static String district(String id) => '/districts/$id';
  static String districtsByCity(String cityId) => '/cities/$cityId/districts';

  // Reviews
  static const String reviews = '/reviews';
  static String review(String id) => '/reviews/$id';
  static String businessReviews(String businessId) =>
      '/businesses/$businessId/reviews';

  // Upload
  static const String upload = '/upload';
  static const String uploadMultiple = '/upload/multiple';
  static String deleteFile(String filename) => '/upload/$filename';

  // Stats
  static const String stats = '/stats';
  static const String myStats = '/stats/my';
}
