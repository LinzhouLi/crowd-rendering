class Blur {
    constructor() {

        let scope = this;
        this.started = false;
        this.startFunc = null;

        let bg = document.getElementById("bg");
        bg.width = window.innerWidth;
        bg.height = window.innerHeight;

        let width = 120, height = 50;
        let button = document.createElement('p');//按钮
        button.innerHTML = "Enter";
        button.style.cssText =
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

        button.onmouseover = function() {
            button.style.cursor = 'pointer';
            button.style.backgroundColor = '#81F79F';
        }

        button.onmousedown = function() {
            document.getElementById("cheat").style.display = 'none';
            scope.started = true;
            if( scope.startFunc ) scope.startFunc();
        }

        document.getElementById("cheat").appendChild( button );

    }
}

export { Blur };
