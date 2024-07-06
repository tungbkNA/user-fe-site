import React, {
    lazy,
    useEffect,
    useState,
    useRef,
    useContext,
    useMemo,
} from 'react';
import './App.css';
import jwtDecode from 'jwt-decode';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Pages from './pages/Pages';
import Data from './components/Data';
import Cart from './common/Cart/Cart';
import Sdata from './components/shops/Sdata';
import ProductDetail from './components/productDetail/ProductDetail';
// import Profile from './components/userProfile/Profile';
import Wrapper from './Wrapper';
// import LoginPage from './components/LoginPage/LoginPage';
import SignUp from './components/SignUpPage/SignUp';
import Checkout from './components/checkout/Checkout';
import Product from './components/product/Product';
import { useDispatch, useSelector } from 'react-redux';
import Protected from './App/Protected';
import axios from './services/axios';
import { INIT } from './redux/actions/AuthAction';
import { authenticateCart } from './redux/slices/CartSlice';
import { fetchCartFromSever, resetToGuestCart } from './services/cartService';
import Loadable from './components/Suspense/Loadable';
import BackToTop from './common/backToTop/BackToTop';
import ButtonDarkMode from './common/drakMode/ButtonDarkMode';
import Verification from './components/SignUpPage/Verification';
import Contact from './components/contact/Contact';
import NotFoundPage from './common/Notfound/NotFoundPage';
import RouteComponent from './HOCs/AppRoute';
const LoginPage = Loadable(
    lazy(() => import('./components/LoginPage/LoginPage')),
);
const Profile = Loadable(
    lazy(() => import('./components/userProfile/Profile')),
);
function App() {
    // const auth = JSON.parse(localStorage.auth);

    const { productItems } = Data;
    // const { shopItems } = Sdata;
    const dispatch = useDispatch();

    // const auth = useSelector((state) => state.auth);

    const localStorage = JSON.parse(
        window.localStorage.getItem('persist:root'),
    );
    const authRedux = useSelector((state) => state.auth);

    var auth = '';
    if (localStorage && authRedux.isAuthenticated === false) {
        auth = JSON.parse(localStorage.auth);
    } else {
        auth = authRedux;
    }

    // console.log('authRedux', authRedux);

    const cart = useSelector((state) => state.cart);
    const roleOfUser = (accessToken) => {
        if (!accessToken) {
            return false;
        }
        const decodedToken = jwtDecode(accessToken);
        return decodedToken.roles[0];
    };

    useEffect(async () => {
        // console.log('App useEffect loading..');

        // try {
        await axios
            .get(process.env.REACT_APP_URL + 'un/refresh-token')
            .then((rs) => {
                // console.log('get accesstoken...');
                const access_token = rs.data.access_token;
                dispatch({
                    type: INIT,
                    payload: {
                        isAuthenticated: true,
                        accessToken: access_token,
                        role: roleOfUser(access_token),
                    },
                });
                // console.log('auth; ', auth);
                if (!auth.isAuthenticated) {
                    // console.log('load cart from server');
                    dispatch(authenticateCart(true));
                    // console.log('cart state in App.js', cart);
                } else {
                    // console.log('set user cart');
                    dispatch(authenticateCart(false));
                    // console.log('user cart state in App.js', cart);
                }
                dispatch(fetchCartFromSever());
            })
            .catch((e) => {
                // console.log('auth: ', auth);
                if (!auth.isAuthenticated) {
                    // console.log('set to cart guest -> set annon true');
                    // dispatch(resetToGuestCart());
                    dispatch(authenticateCart(true));
                }
                // console.log('cart before fectch error: ', cart);
                // console.log('fetch cart with refresh token false: ');
                dispatch(fetchCartFromSever());
                return;
            });
        // console.log('ending...effect');
    }, []);
    useEffect(() => {
        console.log('auth; ', auth);
        if (!auth.isAuthenticated) {
            console.log('load cart from server');
            dispatch(authenticateCart(true));
            console.log('cart state in App.js', cart);
        } else {
            console.log('set user cart');
            dispatch(authenticateCart(false));
            console.log('user cart state in App.js', cart);
        }
        dispatch(fetchCartFromSever());
    }, [auth.isAuthenticated]);
    return (
        <>
            <Wrapper>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <Pages
                                // productItems={productItems}
                                // addToCart={addToCart}
                                // shopItems={productItems}
                                isAuth={auth.isAuthenticated}
                            />
                        }
                    ></Route>
                    <Route
                        path="/product/:categoryId"
                        element={<Product isAuth={auth.isAuthenticated} />}
                    ></Route>

                    <Route path="/cart" element={<Cart />}></Route>
                    <Route
                        path="/product"
                        element={<Product isAuth={auth.isAuthenticated} />}
                    ></Route>
                    <Route
                        path="/login"
                        element={
                            auth.isAuthenticated ? (
                                <Navigate to="/" />
                            ) : (
                                <LoginPage />
                            )
                        }
                    ></Route>
                    <Route
                        path="/profile"
                        element={
                            <Protected isSignedIn={auth.isAuthenticated}>
                                <Profile />
                            </Protected>
                        }
                    ></Route>
                    <Route
                        path="/product-detail/:productId"
                        element={
                            <ProductDetail isAuth={auth.isAuthenticated} />
                        }
                    ></Route>
                    <Route
                        path="/checkout"
                        element={
                            <Protected isSignedIn={auth.isAuthenticated}>
                                <Checkout />
                            </Protected>
                        }
                    ></Route>
                    <Route
                        path="/signUp"
                        element={
                            <RouteComponent
                                isPrivate={true}
                                Component={SignUp}
                                redirectPath={'/'}
                            />
                        }
                    ></Route>
                    <Route
                        path="/signUp/Verification/:userName"
                        element={<Verification />}
                    />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Wrapper>
            <BackToTop />
            <ButtonDarkMode />
        </>
    );
}

export default App;
