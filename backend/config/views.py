from dj_rest_auth.registration.views import RegisterView
from dj_rest_auth.utils import jwt_encode
from dj_rest_auth.app_settings import api_settings

class CustomRegisterView(RegisterView):
    def get_response_data(self, user):
        # Store user on self so we can access it in the create() method
        self.user = user
        data = super().get_response_data(user)
        if isinstance(data, dict):
            # Matches login behavior where tokens are in cookies, not body
            data['refresh'] = ""
        return data

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        
        # If JWT and Cookies are enabled, set the cookies using tokens already generated in perform_create
        if api_settings.USE_JWT and api_settings.JWT_AUTH_HTTPONLY:
            # these are set by RegisterView.perform_create
            refresh_token = getattr(self, "refresh_token", None)
            
            if refresh_token:
                response.set_cookie(
                    api_settings.JWT_AUTH_REFRESH_COOKIE,
                    refresh_token,
                    httponly=True,
                    samesite=api_settings.JWT_AUTH_SAMESITE,
                    secure=api_settings.JWT_AUTH_SECURE,
                    path=api_settings.JWT_AUTH_REFRESH_COOKIE_PATH,
                )
        return response
