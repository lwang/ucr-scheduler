<script>
    let randomColor = "#"+((1<<24)*Math.random()|0).toString(16); 
</script>

<div class="sk-cube-grid">
    <div class="sk-cube sk-cube1" style="background-color:{randomColor};"></div>
    <div class="sk-cube sk-cube2" style="background-color:{randomColor};"></div>
    <div class="sk-cube sk-cube3" style="background-color:{randomColor};"></div>
    <div class="sk-cube sk-cube4" style="background-color:{randomColor};"></div>
    <div class="sk-cube sk-cube5" style="background-color:{randomColor};"></div>
    <div class="sk-cube sk-cube6" style="background-color:{randomColor};"></div>
    <div class="sk-cube sk-cube7" style="background-color:{randomColor};"></div>
    <div class="sk-cube sk-cube8" style="background-color:{randomColor};"></div>
    <div class="sk-cube sk-cube9" style="background-color:{randomColor};"></div>
  </div>

<style>
    .sk-cube-grid {
    width: 60px;
    height: 60px;
    margin: auto auto;
    }

    .sk-cube-grid .sk-cube {
    /* --main-bg-color: white; */
    /* padding: 1px 1px; */
    width: 30%;
    height: 30%;
    margin: 1px 1px;
    /* background-color: rgb(255, 255, 255); */
    /* background-color: var(--main-bg-color); */
    float: left;
    -webkit-animation: sk-cubeGridScaleDelay 2.3s infinite ease-in-out;
            animation: sk-cubeGridScaleDelay 2.3s infinite ease-in-out; 
    
    }

    .sk-cube-grid .sk-cube1 {
    -webkit-animation-delay: 0.2s;
            animation-delay: 0.2s; }
    .sk-cube-grid .sk-cube2 {
    -webkit-animation-delay: 0.3s;
            animation-delay: 0.3s; }
    .sk-cube-grid .sk-cube3 {
    -webkit-animation-delay: 0.4s;
            animation-delay: 0.4s; }
    .sk-cube-grid .sk-cube4 {
    -webkit-animation-delay: 0.1s;
            animation-delay: 0.1s; }
    .sk-cube-grid .sk-cube5 {
    -webkit-animation-delay: 0.2s;
            animation-delay: 0.2s; }
    .sk-cube-grid .sk-cube6 {
    -webkit-animation-delay: 0.3s;
            animation-delay: 0.3s; }
    .sk-cube-grid .sk-cube7 {
    -webkit-animation-delay: 0s;
            animation-delay: 0s; }
    .sk-cube-grid .sk-cube8 {
    -webkit-animation-delay: 0.1s;
            animation-delay: 0.1s; }
    .sk-cube-grid .sk-cube9 {
    -webkit-animation-delay: 0.2s;
            animation-delay: 0.2s; }

    @-webkit-keyframes sk-cubeGridScaleDelay {
    0%, 70%, 100% {
        -webkit-transform: scale3D(1, 1, 1);
                transform: scale3D(1, 1, 1);
    } 35% {
        -webkit-transform: scale3D(0, 0, 1);
                transform: scale3D(0, 0, 1); 
    }
    }

    @keyframes sk-cubeGridScaleDelay {
    0%, 70%, 100% {
        -webkit-transform: scale3D(1, 1, 1);
                transform: scale3D(1, 1, 1);
    } 35% {
        -webkit-transform: scale3D(0, 0, 1);
                transform: scale3D(0, 0, 1);
    } 
    }
</style>