import React, { useCallback, useEffect, useState } from 'react';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Modal, Space, notification, Spin, Tooltip } from 'antd';
import { Button as MUIButton } from '@mui/material';
import { Link } from 'react-router-dom';
import { HeartOutlined, HeartFilled, FrownOutlined } from '@ant-design/icons';
import axios from '../../services/axios';
import LoginPromptNotification from '../../common/notification/LoginPromptNotification';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import Stack from '@mui/material/Stack';
import DeleteIcon from '@mui/icons-material/Delete';
import { BASE, PRODUCT_INVENTORY, ENV_URL } from '../../constants/index';
import { USER, WISHLISTS } from '../../constants/user';
import {
    removeItemFromCart,
    incrementItemQuantity,
    decrementItemQuantity,
    updateCart,
    mergeAnnonCart,
    updateGuestCartState,
} from '../../services/cartService.js';
import Moment from 'react-moment';
import { getImage } from '../../common/img';
import { Helmet } from 'react-helmet';
import {
    getVariantDetail,
    getColorOfCartItem,
    getProductName,
    getPromotion,
    getPromotionValue,
    getStorageOfCartItem,
    CartRequestTYPE,
    getCartDetailRequest,
    getCurrencyFormatComp,
    getDiscountAmountOfItem,
    getProductId,
    isPercentDiscount,
    getDiscountAmount,
    getProductVariantName,
} from './CartUtil';
import moment from 'moment';
import Wrapper from '../../Wrapper';
export const QTY_MAX = 5;
export const QTY_MIN = 1;

const Cart = () => {
    const dispatch = useDispatch();
    const Cart = useSelector((state) => state.cart);
    const { isAuthenticated: isAuth } = useSelector((state) => state.auth);
    const { items, total, baseAmount, totalCount, discount } = Cart;
    const [inventory, setInventory] = useState([]);
    const { confirm } = Modal;
    const [isLoading, setIsLoading] = useState(true);
    const [disableCheckoutBtn, setDisableCheckoutBtn] = useState(false);
    const [wishlists, setWishLists] = useState([]);
    let history = useNavigate();

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

    const showPromiseConfirm = (message, id) => {
        confirm({
            title: message,
            icon: <ExclamationCircleFilled />,
            content: '',
            okText: 'Xoá',
            cancelText: 'Đóng',
            async onOk() {
                try {
                    return await new Promise((resolve, reject) => {
                        setTimeout(resolve, 100);
                    }).then((data) => {
                        const request = getCartDetailRequest(
                            { cart_id: Cart.id, quantity: 1, id: id },
                            CartRequestTYPE.DELETE,
                        );
                        // request.id = id;
                        // console.log('call delete ', request);
                        dispatch(removeItemFromCart(request));
                        dispatch(updateCart());
                        fetchAllItemInventory().catch((e) =>
                            console.log(e.message),
                        );
                    });
                } catch {
                    return console.log('Oops errors!');
                }
            },
            onCancel() {},
        });
    };
    // showPromiseConfirm('Sản phẩm sẽ bị xoá khỏi giỏ');

    function onCheckoutHandler() {
        if (Cart.isAnonymous) {
        } else {
            dispatch(updateGuestCartState()).then((r) => {
                // console.log('return: ', r);
                let { status } = r;
                if (r === 409) {
                    openNotificationWithIcon(
                        'info',
                        'Giỏ hàng có thay đổi',
                        'top',
                        2,
                    );
                } else {
                    history('/checkout');
                }
            });

            // history('/checkout');
        }
    }
    function onUpdateGuestHandler() {
        dispatch(updateGuestCartState());
    }
    const fetchAllItemInventory = useCallback(async () => {
        // setIsLoading(true);
        if (items.length !== 0) {
            try {
                const f = items.map(async (item, index) => {
                    const fe = async (item) => {
                        return await fetchInventory(item);
                    };
                    const res = await fe(item);
                    return { id: item.id, index: index, ...res };
                });

                return Promise.all(f).then(function (results) {
                    // console.log(results);
                    setInventory((prev) => results);
                    return results;
                });
            } catch (e) {
                console.log(e.message);
                setIsLoading(false);
            }
        } else {
            console.log('items empty');
        }
    });

    const fetchInventory = useCallback(async (item, qty = -1) => {
        // console.log('fetch inventory of item');
        const reQty = qty == -1 ? item.quantity : qty;
        const variantId = item.productVariant.id;
        // console.log('variant id: ', variantId);
        const request = {
            product_variant_id: variantId,
            request_quantity: reQty,
        };
        return await axios
            .post(`${BASE}${PRODUCT_INVENTORY}`, request)
            .then((res) => {
                // console.log('return current inventory of item:', res.data);
                return res.data;
                // setInventory(res.data);
            })
            .catch((e) => {
                console.log('fetch invetory error');
                console.log(e.message);
            });
        // cartQty
    });
    const fetchUpdated = useCallback(async () => {
        await fetchAllItemInventory();
    });

    function incrementQty(item) {
        let newQty = item.quantity + 1;
        const fetched = async (item, newQty) => fetchInventory(item, newQty);

        fetchAllItemInventory()
            .then((res) => {
                // setIsLoading(false);
                let inventOfItemIndex = inventory.findIndex(
                    (i) => i.id === item.id,
                );
                // console.log('needed_change', res.need_changed);
                // console.log('item s id: ', item.id);
                // console.log('cur item invent', inventory[inventOfItemIndex]);
                const request = getCartDetailRequest(
                    {
                        cart_id: Cart.id,
                        id: item.id,
                        quantity: newQty,
                        product_variant_id: item.productVariant.id,
                    },
                    CartRequestTYPE.UPDATE,
                );

                // console.log('increment request:', request);
                dispatch(incrementItemQuantity(request));
            })

            .catch((e) => console.log(e.message));
        // fetched(item, newQty).then(res => {

        // })
    }

    function decrementQty(item) {
        let newQty = item.quantity - 1;

        const fetched = async (item, newQty) => fetchInventory(item, newQty);

        fetchAllItemInventory()
            .then((res) => {
                // setIsLoading(false);
                let inventOfItemIndex = inventory.findIndex(
                    (i) => i.id === item.id,
                );
                // console.log('needed_change', res.need_changed);
                // console.log('item s id: ', item.id);
                // console.log('cur item invent', inventory[inventOfItemIndex]);
                // console.log('needed_change', res.need_changed);
                const request = getCartDetailRequest(
                    {
                        cart_id: Cart.id,
                        id: item.id,
                        quantity: newQty,
                        product_variant_id: item.productVariant.id,
                    },
                    CartRequestTYPE.DECR,
                );
                console.log('decrement request:', request);
                dispatch(decrementItemQuantity(request));
            })

            .catch((e) => console.log(e.message));
    }

    async function fetchIsWishlist(item) {
        let { productVariant } = item;
        let { product_id: productId } = productVariant;
        return await axios({
            method: 'get',
            url: `${ENV_URL}${USER}${WISHLISTS}/${productId}`,
        })
            .then((res) => {
                return res.data;
            })
            .catch((error) => {
                return false;
            });
    }

    const fetchAllWihshList = useCallback(async () => {
        if (items.length !== 0) {
            if (!Cart.isAnonymous) {
                try {
                    const f = items.map(async (item, index) => {
                        const fe = async (item) => {
                            return await fetchIsWishlist(item);
                        };
                        const res = await fe(item);
                        console.log('fav res: ', res);
                        let { productVariant: variant } = item;

                        return {
                            id: item.id,
                            index: index,
                            is_favorite: res,
                            product_id: variant.product_id,
                        };
                    });
                    return Promise.all(f).then(function (results) {
                        console.log(results);
                        setWishLists((prev) => results);
                        return results;
                    });
                } catch (e) {
                    console.log(e.message);
                    setIsLoading(true);
                }
            } else {
                const annon_wishlist = items.map((item, index) => {
                    let { productVariant: variant } = item;
                    return {
                        id: item.id,
                        index: index,
                        is_favorite: false,
                        product_id: variant.product_id,
                    };
                });
                setWishLists((prev) => [...annon_wishlist]);
            }
        } else {
            console.log('wishlist empty');
        }
    });

    const handleFavoriteClick = useCallback((index) => {
        // alert("call wishlit" + index)
        if (Cart.isAnonymous) {
            openNotificationWithIcon(
                'info',
                'Bạn cần đăng nhập để có thể thêm sản phẩm vào yêu thích',
            );
        } else {
            let itemIndexInWishlist = wishlists.findIndex(
                (w) => w.index === index,
            );
            console.log('w index: ', wishlists[itemIndexInWishlist]);
            if (itemIndexInWishlist !== -1) {
                let { is_favorite: wishlistItemState, product_id: productId } =
                    wishlists[itemIndexInWishlist];

                if (!wishlistItemState) addWishlists(productId);
                else removeWishlists(productId);
            } else
                openNotificationWithIcon(
                    'error',
                    'Có lỗi xảy ra, vui lòng thử lại sau',
                );
        }
    });
    //add wishlist
    function addWishlists(product_id) {
        axios({
            method: 'post',
            url: `${process.env.REACT_APP_URL}${USER}${WISHLISTS}`,
            data: [{ product_id: product_id }],
        })
            .then((res) => {
                openNotificationWithIcon(
                    'success',
                    'Đã thêm sản phẩm vào yêu thích',
                    '',
                    'top',
                    1,
                );
                fetchAllWihshList().catch((e) => console.log(e));
            })
            .catch((error) => {
                console.log(error);
            });
    }
    //remove wishlist
    function removeWishlists(product_id) {
        axios({
            method: 'delete',
            url: `${process.env.REACT_APP_URL}${USER}${WISHLISTS}`,
            data: [{ product_id: product_id }],
        })
            .then((res) => {
                openNotificationWithIcon(
                    'success',
                    'Đã xoá sản phẩm khỏi yêu thích',
                    '',
                    'top',
                    1,
                );
                fetchAllWihshList().catch((e) => console.log(e));
            })
            .catch((error) => {
                console.log(error);
            });
    }

    const findInventoryByIndex = (index) => {
        return inventory[index];
    };
    const getMaxQtyOfItem = (index) => {
        let findIndx = findInventoryByIndex(index);

        return findIndx.max_quantity;
    };
    const getCurrentQtyOfItem = (index) => {
        return findInventoryByIndex(index).current_inventory;
    };
    const getCurrentIsInWishList = (index) => {
        if (wishlists.length !== 0) {
            return wishlists[index].is_favorite;
        } else return false;
    };
    const getTotalItemCountExcludeOutStock = () => {
        let cartcount = items.reduce((total, item) => {
            if (item.quantity > 0) return total + item.quantity;
            else return total;
        }, 0);
        return cartcount;
    };

    useEffect(() => {
        console.log('...load first');
        setIsLoading(true);
        // await fetchAllItemInventory();
        dispatch(updateGuestCartState()).then((res) => {});

        setIsLoading(false);

        return () => {
            setInventory((prev) => []);
            setWishLists((prev) => []);
        };
    }, []);

    useEffect(() => {
        setIsLoading(true);
        console.log('list iven: ', inventory);
        if (inventory.length !== 0) {
            console.log('indes if');
            let index = inventory.findIndex((i) => {
                console.log('tupe: ', typeof i.need_changed);
                return i.need_changed;
            });

            console.log('index; ', index);
            if (index != -1) {
                // alert('need_dhn')
                // openNotificationWithIcon('info', 'Số lượng giỏ hàng thay đổi', '', 2);
                dispatch(updateGuestCartState());
                fetchAllItemInventory().catch((e) => console.log(e.message));
                setIsLoading(false);
            }
        }
        setIsLoading(false);
    }, [inventory]);

    useEffect(() => {
        console.log('%cwishlist list: ', 'color: red', wishlists);
    }, [wishlists]);

    useEffect(() => {
        console.log('dispatch change');
        if (Cart.isAnonymous) {
            console.log('updateCart()');
            dispatch(updateCart(Cart));
        }
        fetchAllItemInventory().catch((e) => console.log(e.message));
        fetchAllWihshList().catch((e) => console.log(e.message));
        let d = checkAllOutOfStock(Cart.items);

        if (d) setDisableCheckoutBtn((prev) => true);
    }, [Cart]);

    const checkAllOutOfStock = (items) => {
        if (items.length > 0) {
            let filterd = items.filter((i) => i.quantity > 0);
            return filterd.length === 0;
        }
        return false;
    };
    const cartAfterLoginHandler = () => {
        dispatch(mergeAnnonCart());
    };
    const onCompare = () => {
        let time = moment(new Date(Cart.time));
        let now = moment(new Date());
        let mock = moment('22 04 2023 09:17:00', 'DD MM YYYY hh:mm:ss');

        let dueTime = moment(mock).add(30, 'minutes');
        return now >= dueTime;
    };
    // prodcut qty total

    return (
        // <Wrapper>
        <>
            <Helmet>
                <title>Giỏ hàng</title>
            </Helmet>
            {contextHolder}
            {!isLoading && (
                <section className="cart-items">
                    <div className="cart-container container d_flex">
                        {/* if hamro cart ma kunai pani item xaina bhane no diplay */}
                        <div className="top">
                            <div className="d_flex">
                                <h3 style={{ padding: '10px' }}>
                                    Giỏ hàng của bạn ({totalCount} sản phẩm){' '}
                                </h3>
                            </div>
                        </div>
                        <div
                            className={`detail cart-details ${
                                items.length === 0 ? 'w-100-im' : ''
                            } `}
                        >
                            {items.length === 0 && (
                                <div className="no-items product d_flex_jus_center">
                                    <div>
                                        Giỏ hàng trống
                                        {`   `} <FrownOutlined />
                                    </div>

                                    <Link
                                        to={'/product/1'}
                                        className="shop-btn"
                                    >
                                        <i class="fa-solid fa-cart-shopping"></i>
                                        {`   `} Tiếp tục mua sắm
                                    </Link>
                                </div>
                            )}
                            {items.map((item, index) => {
                                return (
                                    <div
                                        className={`cart-list product d_flex ${
                                            item.quantity === 0
                                                ? 'out-stock'
                                                : ''
                                        }`}
                                        key={item.id}
                                    >
                                        {item.quantity > 0 && (
                                            <Link
                                                to={`/product-detail/${getProductId(
                                                    item,
                                                )}`}
                                                className="img"
                                            >
                                                <img
                                                    src={getImage(
                                                        getVariantDetail(item)
                                                            .image,
                                                    )}
                                                    alt=""
                                                />
                                            </Link>
                                        )}
                                        {item.quantity === 0 && (
                                            <div className="img">
                                                <span className="out-stock-badge">
                                                    Sản phẩm hết hàng
                                                </span>
                                                <img
                                                    src={getImage(
                                                        getVariantDetail(item)
                                                            .image,
                                                    )}
                                                    alt=""
                                                />
                                            </div>
                                        )}
                                        <div className="card-cart-details">
                                            <div className="cart-details-item-title">
                                                <h3 className="cart-details-item-name">
                                                    <Link
                                                        to={`/product-detail/${getProductId(
                                                            item,
                                                        )}`}
                                                    >
                                                        {getProductVariantName(
                                                            item,
                                                        )}
                                                    </Link>

                                                    {inventory.length !== 0 &&
                                                        getMaxQtyOfItem(
                                                            index,
                                                        ) <= 5 &&
                                                        findInventoryByIndex(
                                                            index,
                                                        ).current_inventory <=
                                                            5 && (
                                                            <span className="quanity-notif">
                                                                Chỉ còn lại{' '}
                                                                {getCurrentQtyOfItem(
                                                                    index,
                                                                )}{' '}
                                                                sản phẩm
                                                            </span>
                                                        )}
                                                </h3>
                                            </div>
                                            <ul className="cart-product-atrs">
                                                <li>
                                                    Màu:
                                                    <span>
                                                        {' ' +
                                                            getColorOfCartItem(
                                                                item,
                                                            )}
                                                    </span>
                                                </li>
                                                <li>
                                                    RAM:
                                                    <span>
                                                        {getStorageOfCartItem(
                                                            item,
                                                        )}
                                                    </span>
                                                </li>
                                                <li className="single-price">
                                                    Đơn giá:{' '}
                                                    {getCurrencyFormatComp(
                                                        getVariantDetail(item)
                                                            .price,
                                                        false,
                                                        'atr-price',
                                                    )}
                                                    {!getPromotion(item) &&
                                                        item.quantity > 0 && (
                                                            <span>
                                                                {' '}
                                                                {` x `}{' '}
                                                                {item.quantity}{' '}
                                                            </span>
                                                        )}
                                                </li>
                                                {getPromotion(item) &&
                                                    item.quantity > 0 && (
                                                        <li>
                                                            Giảm giá:
                                                            {!isPercentDiscount(
                                                                item,
                                                            ) && (
                                                                <span>
                                                                    {getCurrencyFormatComp(
                                                                        getPromotionValue(
                                                                            item,
                                                                        ),
                                                                        false,
                                                                        'discounted-per-item',
                                                                    )}
                                                                    <span>
                                                                        {' '}
                                                                        {` x `}{' '}
                                                                        {
                                                                            item.quantity
                                                                        }{' '}
                                                                    </span>
                                                                </span>
                                                            )}
                                                            {isPercentDiscount(
                                                                item,
                                                            ) && (
                                                                <span className="percent">
                                                                    {getCurrencyFormatComp(
                                                                        getDiscountAmount(
                                                                            item,
                                                                        ),
                                                                        false,
                                                                        'discounted-per-item',
                                                                    )}
                                                                    {` x `}{' '}
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                    {` (${getPromotionValue(
                                                                        item,
                                                                    )}) `}
                                                                </span>
                                                            )}
                                                        </li>
                                                    )}

                                                {getPromotion(item) &&
                                                    item.quantity <= 0 && (
                                                        <li>
                                                            Giảm giá:
                                                            {!isPercentDiscount(
                                                                item,
                                                            ) && (
                                                                <span>
                                                                    {getCurrencyFormatComp(
                                                                        getPromotionValue(
                                                                            item,
                                                                        ),
                                                                        false,
                                                                        'discounted-per-item',
                                                                    )}
                                                                    <span>
                                                                        {' '}
                                                                        {` x `}{' '}
                                                                        {
                                                                            item.quantity
                                                                        }{' '}
                                                                    </span>
                                                                </span>
                                                            )}
                                                            {isPercentDiscount(
                                                                item,
                                                            ) && (
                                                                <span className="percent">
                                                                    {getCurrencyFormatComp(
                                                                        getDiscountAmount(
                                                                            item,
                                                                        ),
                                                                        false,
                                                                        'discounted-per-item',
                                                                    )}
                                                                    {/* {` x `} {item.quantity} */}
                                                                    {` (${getPromotionValue(
                                                                        item,
                                                                    )}) `}
                                                                </span>
                                                            )}
                                                        </li>
                                                    )}
                                            </ul>
                                            <div className="cart-detail-action-cotainer">
                                                <Stack
                                                    className="action-buttons"
                                                    direction="row"
                                                    spacing={2}
                                                >
                                                    <div></div>
                                                    {wishlists.length > 0 &&
                                                        getCurrentIsInWishList(
                                                            index,
                                                        ) && (
                                                            <Tooltip
                                                                placement="bottom"
                                                                title={
                                                                    'Xoá khỏi yêu thích'
                                                                }
                                                            >
                                                                <MUIButton
                                                                    style={{
                                                                        color: 'black',
                                                                    }}
                                                                    onClick={() =>
                                                                        handleFavoriteClick(
                                                                            index,
                                                                        )
                                                                    }
                                                                    startIcon={
                                                                        <FavoriteIcon
                                                                            style={{
                                                                                color: 'red',
                                                                            }}
                                                                        />
                                                                    }
                                                                >
                                                                    Yêu thích
                                                                </MUIButton>
                                                            </Tooltip>
                                                        )}

                                                    {wishlists.length > 0 &&
                                                        !getCurrentIsInWishList(
                                                            index,
                                                        ) && (
                                                            <Tooltip
                                                                placement="bottom"
                                                                title={
                                                                    'Thêm vào yêu thích'
                                                                }
                                                            >
                                                                <MUIButton
                                                                    style={{
                                                                        color: 'black',
                                                                    }}
                                                                    onClick={() =>
                                                                        handleFavoriteClick(
                                                                            index,
                                                                        )
                                                                    }
                                                                    startIcon={
                                                                        <FavoriteBorderIcon />
                                                                    }
                                                                >
                                                                    Yêu thích
                                                                </MUIButton>
                                                            </Tooltip>
                                                        )}
                                                    <Tooltip
                                                        placement="bottom"
                                                        title={
                                                            'Xoá khỏi giỏ hàng'
                                                        }
                                                    >
                                                        <MUIButton
                                                            className="remove-cart-btn"
                                                            startIcon={
                                                                <DeleteIcon />
                                                            }
                                                            onClick={() =>
                                                                showPromiseConfirm(
                                                                    `Bạn có muốn xoá ${getProductVariantName(
                                                                        item,
                                                                    )} khỏi giỏ hàng?`,
                                                                    item.id,
                                                                )
                                                            }
                                                        >
                                                            Xoá
                                                        </MUIButton>
                                                    </Tooltip>
                                                </Stack>
                                            </div>
                                        </div>
                                        <div className="cart-list-right d_flex_col">
                                            <div className="cart-item-price">
                                                <h3 className="cart-details-total">
                                                    {/* ${item.price}.00 * {item.qty} */}
                                                    <span
                                                        className={`org-price ${
                                                            getPromotion(item)
                                                                ? 'discounted'
                                                                : ''
                                                        }`}
                                                    >
                                                        {getCurrencyFormatComp(
                                                            item.price_detail,
                                                            false,
                                                        )}
                                                    </span>
                                                    {getPromotion(item) && (
                                                        <span
                                                            style={{
                                                                display:
                                                                    'inline-block',
                                                                marginLeft:
                                                                    '1rem',
                                                            }}
                                                        >
                                                            {getCurrencyFormatComp(
                                                                getDiscountAmountOfItem(
                                                                    item,
                                                                ),
                                                                false,
                                                            )}
                                                        </span>
                                                    )}
                                                </h3>
                                            </div>
                                            {item.quantity === 0 && <div></div>}
                                            {/* {inventory.length !== 0 && ( */}
                                            {inventory.length !== 0 &&
                                                item.quantity > 0 && (
                                                    <div className="cart-items-function">
                                                        <div className="cartControl d_flex">
                                                            <button
                                                                disabled={
                                                                    item.quantity <=
                                                                    QTY_MIN
                                                                }
                                                                className="desCart"
                                                                onClick={() =>
                                                                    decrementQty(
                                                                        item,
                                                                    )
                                                                }
                                                            >
                                                                <i className="fa-solid fa-minus"></i>
                                                            </button>

                                                            <div className="quantity">
                                                                {item.quantity}
                                                            </div>
                                                            {/* 
                                                        <button disabled={item.quantity >= QTY_MAX} className="incCart" onClick={() => incrementQty(item)}>
                                                            <i className="fa-solid fa-plus"></i>
                                                        </button> */}

                                                            <button
                                                                disabled={
                                                                    item.quantity >=
                                                                    getMaxQtyOfItem(
                                                                        index,
                                                                    )
                                                                }
                                                                className="incCart"
                                                                onClick={() =>
                                                                    incrementQty(
                                                                        item,
                                                                        index,
                                                                    )
                                                                }
                                                            >
                                                                <i className="fa-solid fa-plus"></i>
                                                            </button>
                                                        </div>

                                                        {/* { inventory.length !== 0 &&
                                                     ( <div className="cartControl d_flex">
                                                        <button disabled={item.quantity <= QTY_MIN} className="desCart" onClick={() => decrementQty(item)}>
                                                            <i className="fa-solid fa-minus"></i>
                                                        </button>
                                                        <div className="quantity">{item.quantity}</div>
                                                        <button disabled={item.quantity >= getMaxQtyOfItem(index)} className="incCart" onClick={() => incrementQty(item, index)}>
                                                            <i className="fa-solid fa-plus"></i>
                                                        </button>
                                                    </div>)
                                                } */}
                                                    </div>
                                                )}

                                            {/* )} */}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {items.length !== 0 && (
                            <div className="cart-total fix product">
                                {checkAllOutOfStock(items) ? (
                                    <div className="out-stock d_flex_col">
                                        <h5>
                                            Không có sản phẩm nào để thanh toán
                                        </h5>
                                        <Link
                                            to={'/product/1'}
                                            className="shop-btn"
                                        >
                                            <i class="fa-solid fa-cart-shopping"></i>
                                            {`   `} Tiếp tục mua sắm
                                        </Link>
                                    </div>
                                ) : (
                                    <div>
                                        <h2>Thông tin đơn hàng</h2>

                                        <div className=" d_flex">
                                            <h4>Số lượng :</h4>
                                            {/* {totalCount} */}
                                            <span>
                                                {getTotalItemCountExcludeOutStock()}
                                            </span>
                                        </div>
                                        <div className=" d_flex">
                                            <h4>Tạm tính :</h4>
                                            {getCurrencyFormatComp(baseAmount)}
                                        </div>
                                        <div className=" d_flex">
                                            <h4>Giảm giá : </h4>
                                            {getCurrencyFormatComp(
                                                Cart.discount,
                                            )}
                                            {/* <h3>${getBaseAmount}.00</h3> */}
                                        </div>
                                        <h3 className="d_flex cart-total-last">
                                            <span className="cart-total-title">
                                                Tổng tiền:
                                            </span>
                                            {getCurrencyFormatComp(Cart.total)}
                                        </h3>
                                        {Cart.isAnonymous ? (
                                            <>
                                                <LoginPromptNotification>
                                                    {' '}
                                                </LoginPromptNotification>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    disabled={
                                                        disableCheckoutBtn
                                                    }
                                                    onClick={onCheckoutHandler}
                                                    className="btn-primary w-100"
                                                >
                                                    Thanh toán
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </>
        // </Wrapper>
    );
};
export const formatFixedFloat = (num, toFixed) => {
    return parseFloat(num).toFixed(toFixed);
};
export default Cart;
