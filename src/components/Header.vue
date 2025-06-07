<!-- vue3 模板 -->

<template>
    <header class="logo">
        <div>

            <span class="nav">千寻</span>
        </div>

        <div class="temperature">

            <span class="temperature2">
                <!-- 获取当前的时间 只需要时分 -->
                <span v-text="currentTime"></span>
            </span>



        </div>
    </header>

</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))

const updateTime = () => {
    currentTime.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
let interval; // 声明变量以便在组件卸载时清除

onMounted(() => {
    // 初始更新一次时间
    updateTime();
    // 设置定时器，每秒更新一次时间
    interval = setInterval(updateTime, 1000);
})

// 正确放置 onUnmounted 钩子
onUnmounted(() => {
    clearInterval(interval);
})
</script>

<style scoped>
.logo {
    /* width 自适应 */
    width: calc(100% - 4rem);
    height: 5.25rem;
    padding: 2rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav {
    color: #FFFFFF;
    font-family: "Inter";
    font-size: 1.88rem;
    font-style: normal;
    font-weight: 400;
    line-height: 2.2rem;
    /* 1.2 */

}

.temperature {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
}

.temperature1 {

    color: #FFFFFF;
    font-family: "Inter";
    font-size: 1rem;
    font-style: normal;
    font-weight: 500;
    line-height: 1.5rem;
    /* 1.5 */


}

.temperature2 {

    color: #FFFFFF;
    font-family: "HarmonyOS Sans SC";
    font-size: 1.5rem;
    font-style: normal;
    font-weight: 500;
    line-height: 2rem;
    /* 1.333 */

    /* 1.333 */

}
</style>
