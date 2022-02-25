import React, { useState } from 'react'
import domtoimage from 'dom-to-image';

import Screen from './screen/Screen'
import './ScreenShot.css';
export default function ScreenShot() {
    const mainCanvasRef = React.createRef();
    const [imgSrc1, setimgSrc] = useState(null);
    // 截屏监听
    const onKeyDown = (e) => {
        let current = mainCanvasRef.current;
        domtoimage
            .toSvg(current)
            .then((imgSrc) => {
                setimgSrc(imgSrc)
            })
            .catch(function (error) {
                console.error('oops, something went wrong!', error);
            });
    };
    const reset = (cutImgSrc) => {
        console.log('cutImgSrc', cutImgSrc)
        setimgSrc(null)
    }
    return (
        <div style={{
            display: 'inline-block'
        }}>
            <div ref={mainCanvasRef} className='screen'></div>
            <button onClick={onKeyDown}>截屏</button>
            {imgSrc1 && <Screen
                imgSrc={imgSrc1}
                reset={reset}
            />}
        </div>
    )

}
