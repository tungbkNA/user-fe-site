import React, { memo, useState, useReducer, useContext } from 'react';
import { Col, Row, Form, notification } from 'antd';

import CheckoutForm from './CheckoutForm';
import OrderList from './OrderList';
import { useNavigate, Link } from 'react-router-dom';
import './style.css';
import { ADDRESS_FIELD } from './CheckoutForm';
import axios from '../../services/axios';
import { CHECKOUT } from '../../constants/user';
import { ENV_URL } from '../../constants/index';
import {
    clearAfterCheckOut,
    fetchCartFromSever,
} from '../../services/cartService';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { checkAllOutOfStock } from '../../common/Cart/CartUtil';

import Wrapper from '../../Wrapper';
import { Helmet } from 'react-helmet';
const paymentData = [{ p_id: 1, name: 'VISA/MASTER Card' }];

export const CHECKOUT_TYPE = {
    PAYMENT: Symbol('payment'),
    ADDRESS: Symbol('address'),
    PROMO: Symbol('promo'),
    CHECKOUT: Symbol('checkout'),
    OTHER_ADDRESS: Symbol('other_address'),
};

export const REQUEST = {
    METHOD: Symbol('payment_method_id'),
    DISTR: Symbol('district'),
    LINE: Symbol('addressLine'),
    PROMO: Symbol('promotionUser_id'),
    PROVINCE: Symbol('province'),
    POSTID: Symbol('postalId'),
};

const initialState = {
    payment_method_id: 1,
    promotionUser_id: -1,
    district: '',
    addressLine: '',
    province: '',
    postalId: '',
};

const checkoutReducer = (state = initialState, action) => {
    const { ADDRESS, PROMO, CHECKOUT, PAYMENT, OTHER_ADDRESS } = CHECKOUT_TYPE;
    const {
        DISTR,
        METHOD,
        POSTID,
        PROMO: PROMO_REQ,
        PROVINCE,
        LINE,
        WARDS,
    } = REQUEST;

    const {
        PROVINCE: PAY_PROVINCE,
        POSTID: PAY_POSTID,
        WARDS: PAY_WARDS,
        LINE: PAY_LINE,
        DISTR: PAY_DISTR,
    } = ADDRESS_FIELD;
    console.log('inside reducer');
    switch (action.type) {
        case 'checkout':
            return { ...state, ...action.payload };
        case PAYMENT: {
            // if(action.payload === undefined) return {...state}
            console.log('my method: ', action.payload);
            return { ...state, [METHOD.description]: action.payload };
        }
        case OTHER_ADDRESS: {
            console.log('call dispatch other address...');
            let addressFull = action.payload;
            const {
                district: dis,
                address_line: line,
                province: prov,
                wards: wards,
                postal_id: postId,
            } = action.payload;
            console.log('address full', addressFull);
            return {
                ...state,
                district: dis,
                addressLine: `${line}, ${wards}`,
                province: prov,
                postalId: `${Math.floor(100000 + Math.random() * 900000)}`,
            };
        }
        case ADDRESS: {
            console.log('call dispatch address...');
            let addressFull = action.payload;
            const {
                district: dis,
                address_line: line,
                province: prov,
                wards: wards,
                postal_id: postId,
            } = action.payload;
            console.log('address full', addressFull);
            return {
                ...state,
                district: dis,
                addressLine: `${line}, ${wards}`,
                province: prov,
                postalId: postId,
            };
        }
        case PROMO: {
            let promo_id = action.payload;
            console.log('promo_id: ' + promo_id);
            return { ...state, promotionUser_id: promo_id };
        }
        default:
            return state;
    }
};
export const CheckoutContext = React.createContext(null);

const Checkout = () => {
    const [api, contextHolder] = notification.useNotification();
    const openNotificationWithIcon = (
        type,
        message,
        description = '',
        placements = 'top',
        duration = '2',
    ) => {
        api[type]({
            message: message,
            placement: placements,
            description: description,
            duration: duration,
        });
    };
    const Cart = useSelector((state) => {
        return state.cart;
    });
    const { items } = Cart;

    const { PROMO } = CHECKOUT_TYPE;
    const [form] = Form.useForm();
    const [CheckoutReducer, dispatch] = useReducer(
        checkoutReducer,
        initialState,
    );
    const [disableCheckoutBtn, setDisableCheckoutBtn] = useState(false);
    const serviceDispatch = useDispatch();
    const navigate = useNavigate();
    const onAddPromotion = (promo_id) => {
        dispatch({ type: PROMO, payload: promo_id });
    };
    const onClickOrder = () => {
        console.log('Order ');
        console.log('Order State: ', CheckoutReducer);

        form.validateFields()
            .then((res) => {
                console.log(res.data);
                console.log(CheckoutReducer);
                axios
                    .post(`${ENV_URL}${CHECKOUT}`, CheckoutReducer)
                    .then((res) => {
                        setDisableCheckoutBtn((prev) => true);
                        console.log(res.data);
                        Swal.fire({
                            icon: 'success',
                            title: `Đặt hàng thành công`,
                            showConfirmButton: false,
                            timer: 1200,
                        });
                        setTimeout(() => {
                            serviceDispatch(clearAfterCheckOut());
                            navigate('/profile', {
                                state: {
                                    profileId: '3',
                                },
                            });
                        }, 1400);
                    })
                    .catch((e) => {
                        console.log(e);
                        let { response } = e;
                        console.log('res: ', response);
                        if (
                            response.status === 409 ||
                            response.status === 406 ||
                            response.status === 400
                        ) {
                             
                            openNotificationWithIcon('error', response.data);
                            setDisableCheckoutBtn((prev) => true);
                            dispatch(fetchCartFromSever().then(
                                setTimeout(() => {
                                    navigate('/cart');
                                }, 2000)
                            ));
                            
                        }
                    });
            })
            .catch((e) => {
                console.log('%c Validate form fail: ', 'color: red');
                console.log(e.errorFields);
            });
    };

    return (
        // <Wrapper>
        <>
            <Helmet>
                <title>Thanh Toán</title>
            </Helmet>
            {contextHolder}
            <CheckoutContext.Provider value={{ CheckoutReducer, dispatch }}>
                {checkAllOutOfStock(items) && (
                    <div
                        style={{ minHeight: '500px' }}
                        className="main-section d_flex_jus_center algin-center"
                    >
                        <div className="out-stock d_flex_col">
                            <h5>Không có sản phẩm nào để thanh toán</h5>
                            <Link to={'/product/1'} className="shop-btn">
                                <i class="fa-solid fa-cart-shopping"></i>
                                {`   `} Tiếp tục mua sắm
                            </Link>
                        </div>
                    </div>
                )}
                {!checkAllOutOfStock(items) && (
                    <section className="main-section">
                        <Row justify="center" gutter={16}>
                            <Col className="gutter-row" span={12}>
                                <CheckoutForm
                                    onFinish={onClickOrder}
                                    form={form}
                                ></CheckoutForm>
                            </Col>
                            <Col className="gutter-row" span={8}>
                                <OrderList
                                    disableCheckoutBtn={disableCheckoutBtn}
                                    onAddPromotion={onAddPromotion}
                                    onClickOrder={onClickOrder}
                                    payMethob = {CheckoutReducer.payment_method_id}
                                ></OrderList>
                            </Col>
                        </Row>
                    </section>
                )}
            </CheckoutContext.Provider>
        </>
    );
};
export default memo(Checkout);