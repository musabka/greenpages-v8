import 'package:dio/dio.dart';

import 'api_endpoints.dart';

class ApiClient {
  late Dio _dio;
  String? _accessToken;

  ApiClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiEndpoints.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Request interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (_accessToken != null) {
            options.headers['Authorization'] = 'Bearer $_accessToken';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // Handle token refresh on 401
          if (error.response?.statusCode == 401) {
            try {
              await _refreshToken();
              // Retry the request
              final opts = Options(
                method: error.requestOptions.method,
                headers: error.requestOptions.headers,
              );
              final response = await _dio.request(
                error.requestOptions.path,
                options: opts,
                data: error.requestOptions.data,
                queryParameters: error.requestOptions.queryParameters,
              );
              return handler.resolve(response);
            } catch (e) {
              return handler.next(error);
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  void setToken(String token) {
    _accessToken = token;
  }

  void clearToken() {
    _accessToken = null;
  }

  // Auth Methods
  Future<Response> login(String email, String password) async {
    return await _dio.post(
      ApiEndpoints.login,
      data: {'email': email, 'password': password},
    );
  }

  Future<Response> register(Map<String, dynamic> data) async {
    return await _dio.post(ApiEndpoints.register, data: data);
  }

  Future<Response> logout() async {
    return await _dio.post(ApiEndpoints.logout);
  }

  Future<Response> _refreshToken() async {
    return await _dio.post(ApiEndpoints.refreshToken);
  }

  Future<Response> forgotPassword(String email) async {
    return await _dio.post(
      ApiEndpoints.forgotPassword,
      data: {'email': email},
    );
  }

  Future<Response> resetPassword(String token, String password) async {
    return await _dio.post(
      ApiEndpoints.resetPassword,
      data: {'token': token, 'password': password},
    );
  }

  Future<Response> getMe() async {
    return await _dio.get(ApiEndpoints.me);
  }

  // Business Methods
  Future<Response> getBusinesses({
    int page = 1,
    int limit = 10,
    String? search,
    String? categoryId,
    String? governorateId,
    String? cityId,
    String? status,
  }) async {
    return await _dio.get(
      ApiEndpoints.businesses,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (search != null) 'search': search,
        if (categoryId != null) 'categoryId': categoryId,
        if (governorateId != null) 'governorateId': governorateId,
        if (cityId != null) 'cityId': cityId,
        if (status != null) 'status': status,
      },
    );
  }

  Future<Response> getBusiness(String id) async {
    return await _dio.get(ApiEndpoints.business(id));
  }

  Future<Response> getMyBusinesses({
    int page = 1,
    int limit = 10,
    String? status,
  }) async {
    return await _dio.get(
      ApiEndpoints.myBusinesses,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (status != null) 'status': status,
      },
    );
  }

  Future<Response> createBusiness(Map<String, dynamic> data) async {
    return await _dio.post(ApiEndpoints.businesses, data: data);
  }

  Future<Response> updateBusiness(String id, Map<String, dynamic> data) async {
    return await _dio.put(ApiEndpoints.updateBusiness(id), data: data);
  }

  Future<Response> deleteBusiness(String id) async {
    return await _dio.delete(ApiEndpoints.deleteBusiness(id));
  }

  // Category Methods
  Future<Response> getCategories({bool includeChildren = false}) async {
    return await _dio.get(
      ApiEndpoints.categories,
      queryParameters: {
        'includeChildren': includeChildren,
      },
    );
  }

  Future<Response> getCategory(String id) async {
    return await _dio.get(ApiEndpoints.category(id));
  }

  // Governorate Methods
  Future<Response> getGovernorates() async {
    return await _dio.get(ApiEndpoints.governorates);
  }

  Future<Response> getGovernorate(String id) async {
    return await _dio.get(ApiEndpoints.governorate(id));
  }

  // City Methods
  Future<Response> getCities({String? governorateId}) async {
    if (governorateId != null) {
      return await _dio.get(ApiEndpoints.citiesByGovernorate(governorateId));
    }
    return await _dio.get(ApiEndpoints.cities);
  }

  Future<Response> getCity(String id) async {
    return await _dio.get(ApiEndpoints.city(id));
  }

  // District Methods
  Future<Response> getDistricts({String? cityId}) async {
    if (cityId != null) {
      return await _dio.get(ApiEndpoints.districtsByCity(cityId));
    }
    return await _dio.get(ApiEndpoints.districts);
  }

  Future<Response> getDistrict(String id) async {
    return await _dio.get(ApiEndpoints.district(id));
  }

  // Review Methods
  Future<Response> getReviews({
    String? businessId,
    int page = 1,
    int limit = 10,
  }) async {
    if (businessId != null) {
      return await _dio.get(
        ApiEndpoints.businessReviews(businessId),
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
    }
    return await _dio.get(
      ApiEndpoints.reviews,
      queryParameters: {
        'page': page,
        'limit': limit,
      },
    );
  }

  Future<Response> createReview(Map<String, dynamic> data) async {
    return await _dio.post(ApiEndpoints.reviews, data: data);
  }

  // Upload Methods
  Future<Response> uploadFile(String filePath) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
    });
    return await _dio.post(ApiEndpoints.upload, data: formData);
  }

  Future<Response> uploadFiles(List<String> filePaths) async {
    final formData = FormData.fromMap({
      'files': filePaths
          .map((path) => MultipartFile.fromFileSync(path))
          .toList(),
    });
    return await _dio.post(ApiEndpoints.uploadMultiple, data: formData);
  }

  Future<Response> deleteFile(String filename) async {
    return await _dio.delete(ApiEndpoints.deleteFile(filename));
  }

  // Stats Methods
  Future<Response> getStats() async {
    return await _dio.get(ApiEndpoints.stats);
  }

  Future<Response> getMyStats() async {
    return await _dio.get(ApiEndpoints.myStats);
  }
}
