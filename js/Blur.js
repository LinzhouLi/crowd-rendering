class Blur {
    constructor() {
        //开始blur加载
        var bg = document.getElementById("bg");
        bg.width = window.innerWidth;
        bg.height = window.innerHeight;

        var width = 120, height = 50;
        var oButton = document.createElement('p');//按钮
        oButton.innerHTML = "进入会议";
        oButton.style.cssText =
            `font-size: 20px;
            width: 120px;
            height: 50px;
            color: white;
            background: #2ECC71;
            vertical-align: middle;
            text-align: center;
            line-height: 50px;
            border-radius: 6px;
            position: fixed;
            left: ${ window.innerWidth / 2 - width / 2 }px;
            top: ${ window.innerHeight / 2 - height / 2 }px;`;
        oButton.onmouseover = function() {
            oButton.style.cursor = 'pointer';
            oButton.style.backgroundColor = '#81F79F';
        }
        oButton.onmousedown = function() {
            document.getElementById("cheat").style.visibility = 'hidden';
        }
        document.getElementById("cheat").appendChild(oButton);
    }
}

export { Blur };
