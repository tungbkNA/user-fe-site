import axios from 'axios';
import TokenService from './tokenService';

const axiosInstance = axios.create({
    withCredentials: true,
});

axiosInstance.interceptors.response.use(
    (res) => {
        return res;
    },
    async (err) => {
        const originalConfig = err.config;

        if (originalConfig.url !== '/un/login' && err.response) {
            // Access Token was expired
            console.log(!originalConfig._retry);
            if (err.response.status === 401 && !originalConfig._retry) {
                originalConfig._retry = true;
                try {
                    const rs = await axiosInstance
                        .get(process.env.REACT_APP_URL + 'un/refresh-token')
                        .catch((error) => {
                            // window.location.reload(''); //handle when refreshtoken expired
                        });

                    if (!rs.data.access_token) {
                        window.location.reload('');
                    }
                    TokenService.setCookieAccessToken(rs.data.access_token);
                    return axiosInstance(originalConfig);
                } catch (_error) {
                    return Promise.reject(_error);
                }
            }
        }

        return Promise.reject(err);
    },
);

export default axiosInstance;
