import React from 'react'

export default function EpochRow({ tokenImage, name, value, actionEle, isCollectEle }) {
  return (
      <div className="epoch-row" style={{ borderBottom: !actionEle && '1px solid #272D3D'}}>
          <div className='left'>
              <div className="token-icon">
                  <img
                      style={{ objectFit: "contain" }}
                      src={tokenImage}
                      alt={name}
                      width={40}
                      height={40}
                  />
              </div>
              <div className="epoch-content">
                  <h1>{name}</h1>
                  <p>
                      <span style={{fontSize:17,}}>{value}</span>
                      <span style={{ color: '#696C80' }}>(${value})</span>
                  </p>
                  { isCollectEle}
              </div>
          </div>
          {actionEle}
          
      </div>
  )
}
