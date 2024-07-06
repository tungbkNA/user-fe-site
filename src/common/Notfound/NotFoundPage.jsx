import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './style.css'
const NotFoundPage = () => {
    const navigate =useNavigate()
  return (
    <>
     <Helmet>
                <title>Not Found</title>
            </Helmet>
    <div className='notFound'>
    <div>
        <h3 className='text'>TRANG KHÔNG TỒN TẠI</h3>
        <img src="./assets/error.png" alt="404" width={500} class="animate-bounce" style={{ animationDuration: "2s" }}></img>
    </div>
    
</div>
<div className='btn_notFound'>

<button  > <i class="fa fa-home"></i> Về trang chủ</button>
</div>

    </>
    
  )
}

export default NotFoundPage