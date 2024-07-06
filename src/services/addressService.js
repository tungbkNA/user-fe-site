import axios from './axios';
//https://open.oapi.vn/location/provinces?page=0&size=30&query=bac
export const BASE = 'https://open.oapi.vn/location';
export const PROVINCE_URL = `${BASE}/provinces`;
//https://open.oapi.vn/location/districts?page=0&size=30&provinceId=1&query=thanh
export const DISTRICT_URL = `${BASE}/districts`;
export const PROVINCE_SEARCH_URL = `${BASE}p/search/?q=`;
export const DISTRICT_SEARCH_URL = `${BASE}p/`;
export const WARD_SEARCH_URL = `${BASE}d/`;
// https://provinces.open-api.vn/api/d/62?depth=2
const getProvince = async () => {
    const response = await axios({
        method: 'get',
        url: 'https://open.oapi.vn/location/provinces',
        withCredentials: false,
    });

    // console.log('respone data: ');
    console.log(response.data.data);
    return response.data.data;
};

const getSearchProvince = async (input) => {
    const response = await axios({
        method: 'get',
        url: 'https://open.oapi.vn/location/provinces?query=' + input ,
        withCredentials: false,
        //  responseType: 'stream'
    });
    return response.data.data;
};

const getDistrict = async () => {
    const response = await axios({
        method: 'get',
        url: 'https://open.oapi.vn/location/districts',
        withCredentials: false,
    });
    return response.data.data;
};

const getSearchDistrict = async (provinceId) => {
    // p/4?depth=2
    const response = await axios({
        method: 'get',
        //https://open.oapi.vn/location/districts?page=0&size=30&provinceId=1&query=thanh
        url: `https://open.oapi.vn/location/districts?provinceId=${provinceId}`,
        withCredentials: false,
    });
    return response.data.data;
};

const getSearchWard = async (districtId) => {
    // https://provinces.open-api.vn/api/d/62?depth=2
    const response = await axios({
        method: 'get',
        //https://open.oapi.vn/location/wards?page=0&size=30&districtId=9&query=khuong
        url:`https://open.oapi.vn/location/wards?districtId=${districtId}`,
        withCredentials: false,
    });
    return response.data.data;
};

export { getProvince, getSearchProvince, getDistrict, getSearchDistrict, getSearchWard };