import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom';
const RouteComponent = ({isAuth, isPrivate, Component, redirectPath}) => {
    const {isAuthenticated} =useSelector(state=>state.auth)
    if (isPrivate) return isAuthenticated ?  <Navigate to={redirectPath} /> : <Component />
  return (
    <Component/>
  )
}

export default RouteComponent