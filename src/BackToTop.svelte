<script>
    export let showOnPx = 150;
    let hidden = true;
  
    function goTop() {
      document.body.scrollIntoView();
    }
  
    function scrollContainer() {
      return document.documentElement || document.body;
    }
  
    function handleOnScroll() {
      if (!scrollContainer()) {
        return;
      }
  
      if (scrollContainer().scrollTop > showOnPx) {
        hidden = false;
      } else {
        hidden = true;
      }
    }
  </script>
  
  <style>
    .back-to-top {
        opacity: 0.5;
        transition: opacity 0.5s, visibility 0.5s;
        border-radius: 50%;
        background-color: #000;
        border: 1px solid #fff;
        background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGUAAAA0CAYAAACTrvadAAADWUlEQVR42u1av2sUURBek0juEpQcGrjiUigpkqApDpSDGPREwRBBOcghGJuYKjYmlV55XQ6swpEqjZ2dSHpBhICdhaWV1bX+AfecJy8xnLu3t++b/T0fDAsHuztvvr335psZx0k5lFJ3yH5o6/f77+g64QhiJeSJGgAR85Eu0xKdeAjZUt74RnZVohQdGRfIWsofP8muScTCJ2SCrKuC4aZELjxCpsx5YYN7EkF+QkrmnECwIZHkI6RiUl4O7EhEcUIWyXqKF22dLEh07Qi5rUICnU3v6TIpUQ5GyJoKH1/JLku0RyNkU0WH72RlifpwUbinooc+sxaEAXdCOkBgtXqvmastbgkT/wiZNAevLU5O61x0nTFnhS3WhBA6aMEgfiArDjyzYH63xWaeCSmbg9YW+169E1Mj2wee/SZ3WoYWPA+Kwl2/oDEkDp3cNMxooVUwW3oWVYptCqBTWSfkAUjIfcv3PgbeqQuhpawSsgFqiWXw/TX68n9bvl8XRCtZI2QH2EJ+cXUQ6TlLwFmm77uRFVHY5tAgjD7NgSJzJc2E6LT0kFODMPp2xRBui6dpFYXHYWgQRh+LtDV+AnzcThMhs6AofBWVcDP/5oNMN8z0gQzu180YfB4jewv4fJhYkalHeUANUo/Z/20gQ/ycuIYZOXQ3Tg3CuI5GJhpmbvO8Afsgcwn7wOrgeuadtP7lTcm+lNCtuAqof41qXKKwlUQNkqBK9sOoRWE3yRqEca1lMJt8HoWT08A8b6QahHHNl8i+AGt+HdqaGeZ5m05KQb5fJDsCG2Zj3E6h87x1J+WgNYwjLWYzHFLgcgaZ502MBmFMcHZjzTh1mTpLGoSRHGSK075hRjeuZ1GDMBLzCKxiLAZ94YssaxBGYmqgyFwZdc/cy4MGYSQGaTFrrPuVsDt50iDM2SkiMrfcHloA53mbTs5hdBzSYm6dfdTmYcg876ojOI1lEZxj7v7d/gFRqPfRJaHCtTZo3WLWDTMH0CAVoWDo+WzbYm7bzPZmXoMwkvMyYGwPzmpkAZT7EVv9Jj/ENALou/HBm/3aoO3/bhKMSsyqT2yPPfXdkNJKbjUIIzHLHiLzxLcC4vJ3a0hI2Yi5bgbWzydMM0FqXz3RIKEQM2vI6HkNr/8Bm6ReqxbVux8AAAAASUVORK5CYII=);
        position: fixed;
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        cursor: pointer;
        top: auto;
        right: 30px;
        bottom: 30px;
        left: auto;
        z-index: 100;
        width: 70px;
        height: 70px;
        background-size: 40%;
        background-repeat: no-repeat;
        background-position: 50%;
    }
  
    .back-to-top.hidden {
      opacity: 0;
      visibility: hidden;
    }
  </style>
  
  <svelte:window on:scroll={handleOnScroll} />
  
  <div class="back-to-top" on:click={goTop} class:hidden></div>
  