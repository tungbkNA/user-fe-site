import * as React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import PopupState, { bindTrigger, bindPopover, bindHover } from 'material-ui-popup-state';
import HoverPopover from 'material-ui-popup-state/HoverPopover';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import './CartPopover.css';
import DeleteIcon from '@mui/icons-material/Delete';
import CartItemUtilClass, { getCurrencyFormatComp,CartRequestTYPE,  getCartDetailRequest } from '../Cart/CartUtil';
import { getImage } from '../img';
import Badge from '@mui/material/Badge';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { removeItemFromCart, incrementItemQuantity, decrementItemQuantity, updateCart, mergeAnnonCart, updateGuestCartState } from '../../services/cartService.js';
import { Modal } from 'antd';
import Tooltip from '@mui/material/Tooltip';

export default function HoverCartPopover({ Cart }) {
    
    const id = 'ouse-over-popover';
    const items = Cart.items;

    const sortList = [...items];
    // sortList.sort((a, b) => b.quantity - a.quantity);

    const dispatch = useDispatch();
    const { confirm } = Modal;
    const list = sortList.map((value, index) => {
        return <MediaCard confirm={confirm} dispatch={dispatch} Cart={Cart} key={index} Item={value}></MediaCard>;
    });
    const checkAllOutOfStock = (items) => {
        if (items.length > 0) {
            let filterd = items.filter((i) => i.quantity > 0);
            return filterd.length === 0;
        }
        return false;
    };

    return (
        <PopupState variant="popover" popupId="demo-popup-popover">
            {(popupState) => (
                <>
                    <div variant="contained" {...bindHover(popupState)} aria-owns={id} className="cart">
                        <Link to="/cart">
                            <i className="fa fa-shopping-bag icon-circle"></i>
                            <span>{Cart.totalCount === 0 ? 0 : Cart.totalCount}</span>
                        </Link>
                    </div>
                    <HoverPopover
                        id={id}
                        {...bindPopover(popupState)}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                    >
                        <Typography
                            component="div"
                            sx={{
                                maxHeight: '300px',
                                p: 2,
                                overflow: 'scroll',
                            }}
                        >
                            <Box className="popover-title">
                                {' '}                       
                                <h4>
                                <Link to={'/cart'}>
                                      Giỏ hàng của bạn ({Cart.totalCount}){' '}
                                </Link>
                                </h4>
                            </Box>

                            {Cart.totalCount === 0 && (
                                <Box
                                    sx={{
                                        width: 300,
                                        marginBottom: '1rem',
                                        display: 'flex',
                                        justifyContent: 'space-around',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div style={{ paddingLeft: '.3rem' }}>
                                        <Typography sx={{ fontWeight: 'bold' }} color="text.primary">
                                            Giỏ hàng trống
                                        </Typography>
                                    </div>
                                </Box>
                            )}
                            {Cart.totalCount !== 0 && list}

                            {/* items.map((value, index) => {
                                    return <MediaCard key={index} Item={value}></MediaCard>;
                                })} */}
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'stretch',
                                flexGrow: '1',
                                marginTop: '1rem',
                            }}
                        >
                            {Cart.totalCount !== 0 && (
                                <div
                                    style={{
                                        width: '100%',
                                        borderTop: '2px solid #cccccc8c',
                                    }}
                                >
                                    <Typography className="total-section" component="div">
                                        {checkAllOutOfStock(sortList) ? (
                                            <></>
                                        ) : (
                                            <>
                                                <span> Tổng tiền </span>
                                                {getCurrencyFormatComp(Cart.total, false, 'popover-total')}
                                            </>
                                        )}
                                    </Typography>
                                    <Button variant="outlined" className="popover-footer-button" fullWidth href="/cart">
                                        Xem toàn bộ giỏ hàng
                                    </Button>
                                </div>
                            )}
                        </Box>
                    </HoverPopover>
                </>
            )}
        </PopupState>
    );
}

function MediaCard({ Cart, Item,dispatch,confirm }) {
    const cartItem = new CartItemUtilClass(Item);
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
                        const request = getCartDetailRequest({ cart_id: Cart.id, quantity: 1, id: id }, CartRequestTYPE.DELETE);
                        // request.id = id;
                        // console.log('call delete ', request);
                        dispatch(removeItemFromCart(request));
                        dispatch(updateCart());
                        // fetchAllItemInventory().catch((e) => console.log(e.message));
                    });
                } catch {
                    return console.log('Oops errors!');
                }
            },
            onCancel() {},
        });
    };
    return (
        <Card
            className={`cart-row ${cartItem.quantity === 0 ? 'out-stock' : ''}`}
            sx={{
                maxWidth: 320,
                marginBottom: '1rem',
                boxShadow: 'inset 0px 0px 0px 2px rgb(234 230 230 / 14%), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
            }}
        >
            <CardContent sx={{ marginTop: '1rem', padding: '20px 16px' }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                    }}
                >
                    <CardMedia className="img-container" sx={{ height: 100, width: 200, flex: '1' }} square={true} image={`${getImage(cartItem.ItemImage)}`} title="green iguana" />

                    <div className="card-content" style={{ paddingLeft: '1rem', flex: '2' }}>
                        {cartItem.quantity === 0 && <div className="out-stock-notif">Hết hàng</div>}
                        {cartItem.promotion ? (
                            <Badge
                                className="promo-badge"
                                sx={{ flex: '1' }}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                color="secondary"
                                badgeContent={cartItem.promotionValue}
                                showZero
                            >
                                <Typography className="product-name" gutterBottom variant="subtitle2" component="h6">
                                    <Link to={`/product-detail/${cartItem.productId}`}>{cartItem.displayName}</Link>
                                </Typography>
                            </Badge>
                        ) : (
                            <Typography className="product-name" gutterBottom variant="subtitle2" component="h6">
                                <Link to={`/product-detail/${cartItem.productId}`}>{cartItem.displayName}</Link>
                            </Typography>
                        )}

                        <Box className="info" sx={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="info-row">
                                <span className="varaint-attr color">
                                    <span className="title">Màu</span> {cartItem.colorOfCartItem}
                                </span>
                                {/* <span className="varaint-attr storage">
                                    <span className="title"></span> {cartItem.storageOfCartItem}
                                </span> */}
                            </div>
                            {cartItem.quantity === 0 && (
                                <div className="info-row">
                                    {/* <span className="quantity">{cartItem.quantity} </span>
                                <span> x </span> */}

                                    {cartItem.promotion ? (
                                        <>
                                            {getCurrencyFormatComp(cartItem.priceDiscountForPerItem, false, ' price dicount-price')}
                                            {` (`}
                                            {getCurrencyFormatComp(cartItem.variantPrice, false, ' price origin-price old')}
                                            {`)`}
                                        </>
                                    ) : (
                                        getCurrencyFormatComp(cartItem.variantPrice, false, ' price origin-price')
                                    )}
                                </div>
                            )}
                            {cartItem.quantity > 0 && (
                                <div className="info-row">
                                    <span className="quantity">{cartItem.quantity} </span>
                                    <span> x </span>

                                    {cartItem.promotion ? (
                                        <>
                                            {getCurrencyFormatComp(cartItem.priceDiscountForPerItem, false, ' price dicount-price')}
                                            {` (`}
                                            {getCurrencyFormatComp(cartItem.variantPrice, false, ' price origin-price old')}
                                            {`)`}
                                        </>
                                    ) : (
                                        getCurrencyFormatComp(cartItem.variantPrice, false, ' price origin-price')
                                    )}
                                </div>
                            )}
                        </Box>
                    </div>
                    <div style={{alignSelf:"flex-end"}}>
                    <Tooltip title="Xoá khỏi giỏ hàng">
                        <Button style={{padding:"0",minWidth:"auto"}} className="remove-cart-btn" startIcon={<DeleteIcon />} onClick={() => showPromiseConfirm(`Bạn có muốn xoá ${cartItem.displayName} khỏi giỏ hàng?`, cartItem.id)}>
                         
                        </Button>
                        </Tooltip>
                    </div>
                </Box>
            </CardContent>
            <CardActions
                sx={{
                    display: 'flex',
                    justifyContent: 'stretch',
                    padding: '0',
                }}
            ></CardActions>
        </Card>
    );
}
