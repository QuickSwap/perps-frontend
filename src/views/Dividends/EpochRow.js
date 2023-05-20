import React from 'react'

export default function EpochRow({ tokenImage,name,value,actionEle }) {
  return (
      <div className="epoch-row">
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
                      {value}
                      <span style={{ color: 'rgb(255 255 255 / 0.75)' }}>(${value})</span>
                  </p>
                  {!actionEle && <hr />}
              </div>
          </div>
          {actionEle}
          
      </div>
  )
}
