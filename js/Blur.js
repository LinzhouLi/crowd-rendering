class Blur {
    constructor() {

        let scope = this;
        this.started = false;
        this.startFunc = null;

        let bg = document.getElementById("bg");
        bg.width = window.innerWidth;
        bg.height = window.innerHeight;

        let width = 120, height = 50;
        let button1 = document.createElement('p');//按钮
        let button2 = document.createElement('p');//按钮
        button1.innerHTML = "Enter";
        button2.innerHTML = "Coffee Break";
        button1.style.cssText =
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
        button2.style.cssText =
            `font-size: 15px;
            width: 120px;
            height: 50px;
            color: white;
            background: #2ECC71;
            vertical-align: middle;
            text-align: center;
            line-height: 50px;
            border-radius: 6px;
            position: fixed;
            left: ${ window.innerWidth - 10 - width }px;
            top: ${ 0 }px;`;

        document.getElementById("cheat2").style.display = 'none';

        button1.onmouseover = function() {
            button1.style.cursor = 'pointer';
            button1.style.backgroundColor = '#81F79F';
        }
        button2.onmouseover = function() {
            button2.style.cursor = 'pointer';
            button2.style.backgroundColor = '#81F79F';
        }

        button1.onmousedown = function() {
            document.getElementById("cheat").style.display = 'none';
            document.getElementById("cheat2").style.display = 'inline';
            scope.started = true;
            if( scope.startFunc ) scope.startFunc();
        }
        button2.onmousedown = function() {
            document.getElementById("cheat2").style.display = 'none';
            window.location.href = "http://121.5.68.218:8098/";
        }

        document.getElementById("cheat").appendChild( button1 );
        document.getElementById("cheat2").appendChild( button2 );

    }
}

export { Blur };
