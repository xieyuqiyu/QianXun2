<template>
    <div class="search-container">
        <div class="search">
            <span class="search-icon">
                <img :src="searchIcon2" alt="search" />
            </span>
            <input type="text" class="search-input" placeholder="百度..." @keydown.enter="searchbaidu" v-model="querybaidu" />
        </div>
        <div class="search">
            <span class="search-icon">
                <img :src="searchIcon1" alt="search" />
            </span>
            <input type="text" class="search-input" placeholder="谷歌..." @keydown.enter="searchgoogle" v-model="querygoogle" />
        </div>

    </div>

</template>

<script setup>
import { ref } from 'vue'
import searchIcon1 from '../assets/Google@1x.svg'
// import searchIcon2 from '../assets/search2.svg'
import searchIcon2 from '../assets/baidu.svg'

const querybaidu = ref('')
const querygoogle = ref('')


const searchbaidu = () => {
    const searchQuery = querybaidu.value.trim()
    if (searchQuery) {
        const url = `https://www.baidu.com/s?wd=${encodeURIComponent(searchQuery)}`
        window.open(url, '_blank') 
    }
}
const searchgoogle = () => {
    const searchQuery = querygoogle.value.trim()
    if (searchQuery) {
        const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`
        window.open(url, '_blank')
    } 
}
</script>

<style scoped>
.search-container {
    display: flex;
    flex-direction: row;
    /* 列排列 */
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 2rem 0rem;
    gap: 8rem;
}
.search {
    display: flex;
    flex-direction: row;
    /* 行内排列 */
    width: 30rem;
    height: 4rem;
    padding: 0rem 1rem 0rem 3rem;
    align-items: center;
    flex-shrink: 0;

    background: rgba(255, 255, 255, 0.10);
    box-shadow: 0rem 0.25rem 0.25rem 0rem rgba(0, 0, 0, 0.20), 0rem 0rem 2.44rem 0rem rgba(134, 87, 87, 0.42);

    border: none;
    border-radius: 624.94rem;
}

.search-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
}

.search-input {
    width: 35rem;
    height: 4rem;
    border: none;
    background: rgba(255, 255, 255, 0.0);
    outline: none;
    /* 去掉聚焦时的边框 */
    box-shadow: none;
    /* 去掉阴影 */
    -webkit-appearance: none;
    /* 去掉默认样式 */
    -moz-appearance: none;
    /* 去掉默认样式 */
    appearance: none;
    /* 去掉默认样式 */

    color: rgba(255, 255, 255, 0.50);
    font-family: "Inter";
    font-size: 1rem;
    font-style: normal;
    font-weight: 400;
    line-height: 1.5rem;
    margin-left: 2rem;
}

.search-input::placeholder {
    color: rgba(255, 255, 255, 0.50);
    font-family: "Inter";
    font-size: 1rem;
    font-style: normal;
    font-weight: 400;
    line-height: 1.5rem;
}
</style>