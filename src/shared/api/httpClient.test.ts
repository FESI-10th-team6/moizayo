/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError, AxiosResponse } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { httpClient, TEST_TEAM_ID } from './httpClient';
import { ApiError } from './apiError';
import { logError, logRequest, logResponse } from './logger';
import { API_CONFIG } from '@/shared/config';

// Mock dependencies
jest.mock('axios');
jest.mock('next-auth/react');
jest.mock('./logger');
jest.mock('@/shared/config', () => ({
  API_CONFIG: {
    BASE_URL: jest.fn((teamId: string) => `https://api.example.com/team/${teamId}`),
    TIMEOUT: 10000,
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockedSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockedLogRequest = logRequest as jest.MockedFunction<typeof logRequest>;
const mockedLogResponse = logResponse as jest.MockedFunction<typeof logResponse>;
const mockedLogError = logError as jest.MockedFunction<typeof logError>;

// Mock axios instance
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  },
  create: jest.fn(),
};

// Mock window and location
const mockLocation = {
  pathname: '/ko/dashboard',
  href: '',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('httpClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Reset location mock
    mockLocation.pathname = '/ko/dashboard';
    mockLocation.href = '';

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        removeItem: jest.fn(),
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('axios instance creation', () => {
    it('should create axios instance with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: `https://api.example.com/team/${TEST_TEAM_ID}`,
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should use TEST_TEAM_ID for base URL', () => {
      expect(API_CONFIG.BASE_URL).toHaveBeenCalledWith(TEST_TEAM_ID);
    });
  });

  describe('request interceptor', () => {
    let requestInterceptor;

    beforeEach(() => {
      // Get the request interceptor from the mock
      const interceptorCall = mockAxiosInstance.interceptors.request.use.mock.calls[0];
      requestInterceptor = interceptorCall[0];
    });

    describe('authentication handling', () => {
      it('should add authorization header when authRequired is true and session exists', async () => {
        const mockSession = {
          user: {
            accessToken: 'test-token-123',
          },
        };
        mockedGetSession.mockResolvedValue(mockSession);

        const config = {
          authRequired: true,
          headers: {},
        };

        const result = await requestInterceptor(config);

        expect(mockedGetSession).toHaveBeenCalled();
        expect(result.headers.Authorization).toBe('Bearer test-token-123');
      });

      it('should handle missing session gracefully', async () => {
        mockedGetSession.mockResolvedValue(null);

        const config = {
          authRequired: true,
          headers: {},
        };

        const result = await requestInterceptor(config);

        expect(result.headers.Authorization).toBe('Bearer undefined');
      });

      it('should not add authorization header when authRequired is false', async () => {
        const config = {
          authRequired: false,
          headers: {},
        };

        const result = await requestInterceptor(config);

        expect(mockedGetSession).not.toHaveBeenCalled();
        expect(result.headers.Authorization).toBeUndefined();
      });

      it('should not add authorization header when authRequired is undefined', async () => {
        const config = {
          headers: {},
        };

        const result = await requestInterceptor(config);

        expect(mockedGetSession).not.toHaveBeenCalled();
        expect(result.headers.Authorization).toBeUndefined();
      });
    });

    describe('FormData handling', () => {
      it('should convert data to FormData when Content-Type is multipart/form-data', async () => {
        const config = {
          headers: { 'Content-Type': 'multipart/form-data' },
          data: {
            name: 'John Doe',
            age: 30,
            active: true,
          },
        };

        const result = await requestInterceptor(config);

        expect(result.data).toBeInstanceOf(FormData);
        expect(result.data.get('name')).toBe('John Doe');
        expect(result.data.get('age')).toBe('30');
        expect(result.data.get('active')).toBe('true');
      });

      it('should handle Date objects in FormData', async () => {
        const testDate = new Date('2023-12-25T10:30:00Z');
        const config = {
          headers: { 'Content-Type': 'multipart/form-data' },
          data: {
            createdAt: testDate,
          },
        };

        const result = await requestInterceptor(config);

        expect(result.data.get('createdAt')).toBe('2023-12-25T10:30:00.000Z');
      });

      it('should handle File objects in FormData', async () => {
        const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
        const config = {
          headers: { 'Content-Type': 'multipart/form-data' },
          data: {
            file: testFile,
          },
        };

        const result = await requestInterceptor(config);

        expect(result.data.get('file')).toBe(testFile);
      });

      it('should skip null and undefined values in FormData', async () => {
        const config = {
          headers: { 'Content-Type': 'multipart/form-data' },
          data: {
            validField: 'value',
            nullField: null,
            undefinedField: undefined,
          },
        };

        const result = await requestInterceptor(config);

        expect(result.data.get('validField')).toBe('value');
        expect(result.data.get('nullField')).toBeNull();
        expect(result.data.get('undefinedField')).toBeNull();
      });

      it('should handle empty data object for FormData', async () => {
        const config = {
          headers: { 'Content-Type': 'multipart/form-data' },
          data: {},
        };

        const result = await requestInterceptor(config);

        expect(result.data).toBeInstanceOf(FormData);
      });

      it('should handle undefined data for FormData', async () => {
        const config = {
          headers: { 'Content-Type': 'multipart/form-data' },
          data: undefined,
        };

        const result = await requestInterceptor(config);

        expect(result.data).toBeInstanceOf(FormData);
      });
    });

    it('should call logRequest with config', async () => {
      const config = { headers: {} };

      await requestInterceptor(config);

      expect(mockedLogRequest).toHaveBeenCalledWith(config);
    });
  });

  describe('response interceptor', () => {
    let responseSuccessHandler;
    let responseErrorHandler;

    beforeEach(() => {
      const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0];
      responseSuccessHandler = interceptorCall[0];
      responseErrorHandler = interceptorCall[1];
    });

    describe('success response', () => {
      it('should log response and return it', () => {
        const mockResponse = {
          data: { success: true },
          status: 200,
          statusText: 'OK',
        } as AxiosResponse;

        const result = responseSuccessHandler(mockResponse);

        expect(mockedLogResponse).toHaveBeenCalledWith(mockResponse);
        expect(result).toBe(mockResponse);
      });
    });

    describe('error handling', () => {
      it('should handle network errors', async () => {
        const networkError = new AxiosError('Network Error');
        networkError.response = undefined;

        await expect(responseErrorHandler(networkError)).rejects.toThrow('네트워크 연결 상태를 확인해주세요.');
        expect(mockedLogError).toHaveBeenCalledWith(networkError);
      });

      it('should handle timeout errors', async () => {
        const timeoutError = new AxiosError('Timeout');
        timeoutError.code = 'ECONNABORTED';
        timeoutError.response = undefined;

        await expect(responseErrorHandler(timeoutError)).rejects.toThrow('요청 시간이 초과되었습니다.');
        expect(mockedLogError).toHaveBeenCalledWith(timeoutError);
      });

      describe('401 Unauthorized handling', () => {
        it('should handle 401 error on non-auth pages', async () => {
          mockLocation.pathname = '/ko/dashboard';

          const error401 = new AxiosError('Unauthorized');
          error401.response = {
            status: 401,
            data: { message: 'Token expired' },
          } as AxiosResponse;

          mockedSignOut.mockResolvedValue(undefined);

          const result = await responseErrorHandler(error401);

          expect(window.localStorage.removeItem).toHaveBeenCalledWith('accessToken');
          expect(mockedSignOut).toHaveBeenCalledWith({ redirect: false });
          expect(result).toBeUndefined();
        });

        it('should extract locale from current path for redirect', async () => {
          mockLocation.pathname = '/en/dashboard';

          const error401 = new AxiosError('Unauthorized');
          error401.response = {
            status: 401,
            data: { message: 'Token expired' },
          } as AxiosResponse;

          mockedSignOut.mockResolvedValue(undefined);

          await responseErrorHandler(error401);

          expect(mockLocation.href).toBe('/en/signin');
        });

        it('should use default locale when none found in path', async () => {
          mockLocation.pathname = '/dashboard';

          const error401 = new AxiosError('Unauthorized');
          error401.response = {
            status: 401,
            data: { message: 'Token expired' },
          } as AxiosResponse;

          mockedSignOut.mockResolvedValue(undefined);

          await responseErrorHandler(error401);

          expect(mockLocation.href).toBe('/ko/signin');
        });

        it('should not handle 401 on signin page', async () => {
          mockLocation.pathname = '/ko/signin';

          const error401 = new AxiosError('Unauthorized');
          error401.response = {
            status: 401,
            data: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
          } as AxiosResponse;

          await expect(responseErrorHandler(error401)).rejects.toBeInstanceOf(ApiError);
          expect(mockedSignOut).not.toHaveBeenCalled();
        });

        it('should not handle 401 on signup page', async () => {
          mockLocation.pathname = '/ko/signup';

          const error401 = new AxiosError('Unauthorized');
          error401.response = {
            status: 401,
            data: { message: 'Invalid credentials' },
          } as AxiosResponse;

          await expect(responseErrorHandler(error401)).rejects.toBeInstanceOf(ApiError);
          expect(mockedSignOut).not.toHaveBeenCalled();
        });
      });

      it('should handle 500+ server errors', async () => {
        const serverError = new AxiosError('Internal Server Error');
        serverError.response = {
          status: 500,
          data: { message: 'Server error', code: 'INTERNAL_ERROR' },
        } as AxiosResponse;

        await expect(responseErrorHandler(serverError)).rejects.toBeInstanceOf(ApiError);
        expect(mockedLogError).toHaveBeenCalledWith(serverError);
      });

      it('should wrap other errors in ApiError', async () => {
        const badRequestError = new AxiosError('Bad Request');
        badRequestError.response = {
          status: 400,
          data: { message: 'Validation failed', code: 'VALIDATION_ERROR' },
        } as AxiosResponse;

        try {
          await responseErrorHandler(badRequestError);
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).message).toBe('Validation failed');
          expect((error as ApiError).code).toBe('VALIDATION_ERROR');
          expect((error as ApiError).status).toBe(400);
        }
      });

      it('should handle errors with missing message and code', async () => {
        const genericError = new AxiosError('Generic Error');
        genericError.response = {
          status: 400,
          data: {},
        } as AxiosResponse;

        try {
          await responseErrorHandler(genericError);
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).message).toBe('알 수 없는 오류가 발생했습니다.');
          expect((error as ApiError).code).toBe('UNKNOWN_ERROR');
          expect((error as ApiError).status).toBe(400);
        }
      });

      it('should handle errors with null data', async () => {
        const nullDataError = new AxiosError('Null Data Error');
        nullDataError.response = {
          status: 400,
          data: null,
        } as AxiosResponse;

        try {
          await responseErrorHandler(nullDataError);
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).message).toBe('알 수 없는 오류가 발생했습니다.');
          expect((error as ApiError).code).toBe('UNKNOWN_ERROR');
        }
      });
    });
  });

  describe('httpClient methods', () => {
    beforeEach(() => {
      mockAxiosInstance.get.mockResolvedValue({ data: { result: 'get-success' } });
      mockAxiosInstance.post.mockResolvedValue({ data: { result: 'post-success' } });
      mockAxiosInstance.put.mockResolvedValue({ data: { result: 'put-success' } });
      mockAxiosInstance.delete.mockResolvedValue({ data: { result: 'delete-success' } });
    });

    describe('get method', () => {
      it('should make GET request and return data', async () => {
        const result = await httpClient.get('/test-endpoint');

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test-endpoint', undefined);
        expect(result).toEqual({ result: 'get-success' });
      });

      it('should pass config to GET request', async () => {
        const config = { authRequired: true };
        await httpClient.get('/test-endpoint', config);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test-endpoint', config);
      });

      it('should handle GET request errors', async () => {
        const apiError = new ApiError('Get failed', 'GET_ERROR', 400);
        mockAxiosInstance.get.mockRejectedValue(apiError);

        await expect(httpClient.get('/test-endpoint')).rejects.toThrow(apiError);
      });
    });

    describe('post method', () => {
      it('should make POST request and return data', async () => {
        const postData = { name: 'test' };
        const result = await httpClient.post('/test-endpoint', postData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test-endpoint', postData, undefined);
        expect(result).toEqual({ result: 'post-success' });
      });

      it('should make POST request without data', async () => {
        const result = await httpClient.post('/test-endpoint');

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test-endpoint', undefined, undefined);
        expect(result).toEqual({ result: 'post-success' });
      });

      it('should pass config to POST request', async () => {
        const postData = { name: 'test' };
        const config = { authRequired: true };
        await httpClient.post('/test-endpoint', postData, config);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test-endpoint', postData, config);
      });

      it('should handle POST request errors', async () => {
        const apiError = new ApiError('Post failed', 'POST_ERROR', 400);
        mockAxiosInstance.post.mockRejectedValue(apiError);

        await expect(httpClient.post('/test-endpoint', {})).rejects.toThrow(apiError);
      });
    });

    describe('put method', () => {
      it('should make PUT request and return data', async () => {
        const putData = { id: 1, name: 'updated' };
        const result = await httpClient.put('/test-endpoint', putData);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test-endpoint', putData, undefined);
        expect(result).toEqual({ result: 'put-success' });
      });

      it('should make PUT request without data', async () => {
        const result = await httpClient.put('/test-endpoint');

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test-endpoint', undefined, undefined);
        expect(result).toEqual({ result: 'put-success' });
      });

      it('should pass config to PUT request', async () => {
        const putData = { name: 'test' };
        const config = { authRequired: true };
        await httpClient.put('/test-endpoint', putData, config);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test-endpoint', putData, config);
      });

      it('should handle PUT request errors', async () => {
        const apiError = new ApiError('Put failed', 'PUT_ERROR', 400);
        mockAxiosInstance.put.mockRejectedValue(apiError);

        await expect(httpClient.put('/test-endpoint', {})).rejects.toThrow(apiError);
      });
    });

    describe('delete method', () => {
      it('should make DELETE request and return data', async () => {
        const result = await httpClient.delete('/test-endpoint');

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test-endpoint', undefined);
        expect(result).toEqual({ result: 'delete-success' });
      });

      it('should pass config to DELETE request', async () => {
        const config = { authRequired: true };
        await httpClient.delete('/test-endpoint', config);

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test-endpoint', config);
      });

      it('should handle DELETE request errors', async () => {
        const apiError = new ApiError('Delete failed', 'DELETE_ERROR', 400);
        mockAxiosInstance.delete.mockRejectedValue(apiError);

        await expect(httpClient.delete('/test-endpoint')).rejects.toThrow(apiError);
      });
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle empty string URLs', async () => {
      await httpClient.get('');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('', undefined);
    });

    it('should handle URLs with query parameters', async () => {
      await httpClient.get('/users?page=1&limit=10');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users?page=1&limit=10', undefined);
    });

    it('should handle complex nested data objects', async () => {
      const complexData = {
        user: {
          profile: {
            name: 'John',
            preferences: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
        metadata: ['tag1', 'tag2'],
      };

      await httpClient.post('/complex', complexData);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/complex', complexData, undefined);
    });

    it('should handle large data payloads', async () => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` })),
      };

      await httpClient.post('/bulk', largeData);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/bulk', largeData, undefined);
    });
  });

  describe('type safety and generics', () => {
    it('should support generic return types for GET requests', async () => {
      interface UserResponse {
        id: number;
        name: string;
      }

      mockAxiosInstance.get.mockResolvedValue({ data: { id: 1, name: 'John' } });

      const result = await httpClient.get<UserResponse>('/user/1');
      
      expect(result).toEqual({ id: 1, name: 'John' });
      expect(typeof result.id).toBe('number');
      expect(typeof result.name).toBe('string');
    });

    it('should support generic data types for POST requests', async () => {
      interface CreateUserRequest {
        name: string;
        email: string;
      }

      interface CreateUserResponse {
        id: number;
        success: boolean;
      }

      mockAxiosInstance.post.mockResolvedValue({ data: { id: 1, success: true } });

      const requestData: CreateUserRequest = { name: 'John', email: 'john@example.com' };
      const result = await httpClient.post<CreateUserResponse, CreateUserRequest>('/users', requestData);
      
      expect(result).toEqual({ id: 1, success: true });
    });
  });

  describe('concurrent requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = [
        httpClient.get('/endpoint1'),
        httpClient.get('/endpoint2'),
        httpClient.post('/endpoint3', { data: 'test' }),
      ];

      await Promise.all(requests);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });

    it('should handle mixed success and failure in concurrent requests', async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: 'success' })
        .mockRejectedValueOnce(new ApiError('Failed', 'ERROR', 400));

      const results = await Promise.allSettled([
        httpClient.get('/success'),
        httpClient.get('/failure'),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });
  });
});