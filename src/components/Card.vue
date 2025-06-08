<template>
    <div class="card-container" ref="cardContainer">
        <!-- 主要显示区域 - 前两行卡片 -->
        <a v-for="(card, index) in visibleCards" :key="card.id" :href="formatUrl(card.url)" target="_blank"
            class="card">
            <!-- 添加删除按钮 -->
            <div class="delete-btn" style="right: 40px;" @click.stop.prevent="editInfo(card)">/</div>
            <div class="delete-btn" @click.stop.prevent="confirmDelete(card.id)">X</div>
            <img :src="getImageUrl(card.img)" alt="card image" class="card-image" />
            <div class="card-body">
                <h3 class="card-title">{{ card.title }}</h3>
                <p class="card-desc">{{ card.desc }}</p>
            </div>
        </a>

        <!-- 缩略图区域 - 折叠/展开按钮 -->
        <div v-if="hiddenCards.length > 0" class="thumbnail-toggle" @click="toggleThumbnails">
            <span v-if="!showThumbnails">显示更多 ({{ hiddenCards.length }})</span>
            <span v-else>收起</span>
        </div>

        <!-- 缩略图区域 - 缩略图卡片 -->
        <div v-if="showThumbnails" class="thumbnail-container">
            <a v-for="card in hiddenCards" :key="`thumb-${card.id}`" :href="formatUrl(card.url)" target="_blank"
                class="thumbnail-card">
                <img :src="getImageUrl(card.img)" alt="card image" class="thumbnail-image" />
                <div class="thumbnail-title">{{ card.title }}</div>
                <div class="thumbnail-title" style="margin-left: 10px;font-size: 14px;opacity: 0.7;">{{ card.desc }}
                </div>
            </a>
        </div>
    </div>

    <!-- 悬浮添加卡片 -->
    <div class="floating-card add-card" ref="floatingCard" :style="{
        transform: `translate(${-cardPosition.x}px, ${cardPosition.y}px)`,
        top: '0px',
        right: '0px'
    }" :class="{ 'card-expanded': isCardExpanded, 'dragging': isDragging }">
        <div class="card-handle" @mousedown="startDrag">
            <div class="handle-dots"></div>
        </div>

        <div class="add-card-toggle" @click="toggleCardExpand">
            <span v-if="!isCardExpanded">+</span>
            <span v-else>-</span>
        </div>

        <div v-show="isCardExpanded" class="add-card-form">
            <div class="form-group">
                <input class="form-input" placeholder="站点名称" v-model="newCard.name" />
            </div>

            <div class="form-group">
                <input class="form-input" placeholder="站点描述" v-model="newCard.description" />
            </div>

            <div class="form-group">
                <input class="form-input" placeholder="站点URL" v-model="newCard.url" />
            </div>

            <div class="form-actions">
                <button class="upload-btn" @click="triggerFileUpload">
                    <span class="btn-icon">+</span>
                    <span>上传图标</span>
                </button>
                <input type="file" ref="fileInput" style="display: none;" @change="handleFileUpload" accept="image/*" />

                <button class="submit-btn" @click="submitForm">
                    <span>{{ isEdit ? '更新' : '添加' }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { get, post, upload, del, getImageUrl, formatUrl, put } from '../utils/api';

// 添加拖拽相关的状态
const cardPosition = ref({ x: 30, y: 120 }); // 初始位置
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const floatingCard = ref(null);
const isCardExpanded = ref(false);

// 切换卡片展开/收起状态
const toggleCardExpand = () => {
    isCardExpanded.value = !isCardExpanded.value;
};

// 开始拖拽
const startDrag = (event) => {
    // 只允许通过卡片顶部的拖动区域拖动
    if (event.target.closest('.card-handle')) {
        // 阻止默认行为，防止文本选择
        event.preventDefault();
        event.stopPropagation();
        isDragging.value = true;

        // 计算鼠标点击位置与卡片左上角的偏移量
        const cardRect = floatingCard.value.getBoundingClientRect();
        dragOffset.value = {
            x: cardRect.right - event.clientX,
            y: event.clientY - cardRect.top
        };

        // 禁用文本选择
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';

        // 添加鼠标移动和松开事件监听
        document.addEventListener('mousemove', onDrag, { passive: false });
        document.addEventListener('mouseup', stopDrag);

        // 阻止拖拽过程中的默认行为
        document.addEventListener('selectstart', preventSelection);
        document.addEventListener('dragstart', preventSelection);
    }
};

// 防止选择事件
const preventSelection = (e) => {
    e.preventDefault();
    return false;
};

// 拖拽中
let rafId = null;
const onDrag = (event) => {
    if (isDragging.value) {
        // 阻止默认行为
        event.preventDefault();

        // 直接更新位置，不使用 requestAnimationFrame
        cardPosition.value = {
            x: window.innerWidth - event.clientX - dragOffset.value.x,
            y: event.clientY - dragOffset.value.y
        };
    }
};

// 停止拖拽
const stopDrag = () => {
    isDragging.value = false;

    // 恢复文本选择
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';

    // 移除事件监听
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('selectstart', preventSelection);
    document.removeEventListener('dragstart', preventSelection);


    // 保存位置到本地存储
    localStorage.setItem('addCardPosition', JSON.stringify(cardPosition.value));

};

// 其他现有代码保持不变...
const fileInput = ref(null);
const isUploading = ref(false);
const newCard = ref({
    name: '',
    description: '',
    url: '',
    logo: ''
});
// 用于提交状态
const isEdit = ref(false);
const isSubmitting = ref(false);
const editInfo = (card) => {
    // 这里可以实现编辑功能
    // 例如，打开一个模态框，填充当前卡片信息
    isEdit.value = true;
    console.log('编辑卡片:', card);
    newCard.value.name = card.title;
    newCard.value.description = card.desc;
    newCard.value.url = card.url;
    newCard.value.logo = card.img;
    newCard.value.id = card.id; // 保存卡片ID以便更新

};

// 确认删除
const confirmDelete = (id) => {
    window.$message.confirm(
        '确定要删除这个导航站点吗？',
        '删除确认',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
        .then(() => {
            deleteNavigation(id);
        })
        .catch(() => {
            // 用户取消删除
        });
};

// 删除导航站点
const deleteNavigation = async (id) => {
    try {
        await del(`/api/navigation/${id}`);

        // 从列表中移除已删除的项
        cards.value = cards.value.filter(card => card.id !== id);

        window.$message({
            type: 'success',
            message: '删除成功！',
        });
    } catch (error) {
        console.error('删除出错:', error);
        window.$message({
            type: 'error',
            message: '删除失败，请重试',
        });
    }
};

// 提交表单
const submitForm = async () => {
    // 验证表单数据
    if (!newCard.value.name || !newCard.value.description || !newCard.value.url) {
        window.$message.error('请填写完整信息')
        return;
    }

    try {

        isSubmitting.value = true;

        // 创建要提交的数据
        const cardData = {
            name: newCard.value.name,
            description: newCard.value.description,
            url: newCard.value.url,
            logo: newCard.value.logo
        };

        // 发送请求到服务器
        if (isEdit.value) {
            // 如果是编辑状态，发送PUT请求
            const result = await put(`/api/navigation/${newCard.value.id}`, cardData);
            console.log('卡片更新成功:', result);
            window.$message.success('卡片更新成功')
            // 更新本地卡片数据
            fetchNavigations(); // 重新获取导航站点列表
            isEdit.value = false; // 重置编辑状态
        } else {
            // 否则发送POST请求
            const result = await post('/api/navigation', cardData);
            console.log('卡片添加成功:', result);
            window.$message.success('卡片添加成功')
            fetchNavigations(); // 重新获取导航站点列表
        }

    } catch (error) {
        console.error('提交出错:', error);
        window.$message.error('提交失败')
    } finally {
        isSubmitting.value = false;
    }
};

// 处理文件上传
const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        isUploading.value = true;

        // 创建FormData对象
        const formData = new FormData();
        formData.append('file', file);

        // 调用上传接口
        const result = await upload('/api/navigation/upload', formData);
        console.log('上传成功:', result);

        // 保存上传的图片URL到表单数据
        newCard.value.logo = result.data.path;
        window.$message.success('上传成功')

    } catch (error) {
        console.error('上传出错:', error);
        window.$message.error('上传失败')
    } finally {
        isUploading.value = false;
        // 重置文件输入，允许重新选择同一文件
        event.target.value = '';
    }
};
// 触发文件上传
const triggerFileUpload = () => {
    fileInput.value.click();
};
// 在组件挂载时获取导航站点
import { onMounted } from 'vue';

onMounted(() => {
    fetchNavigations();

    // 恢复保存的位置
    const savedPosition = localStorage.getItem('addCardPosition');
    if (savedPosition) {
        try {
            cardPosition.value = JSON.parse(savedPosition);
        } catch (e) {
            console.error('无法解析保存的位置:', e);
        }
    }

    nextTick(() => {
        calculateCardsPerRow();
        window.addEventListener('resize', handleResize);
    });
});

// 获取所有导航站点
const fetchNavigations = async () => {
    try {
        const data = await get('/api/navigation');
        console.log('获取导航站点成功:', data);

        // 将API返回的数据转换为cards数组格式
        cards.value = data?.data.map(item => ({
            id: item.id,
            img: item.logo,
            title: item.name,
            desc: item.description,
            url: item.url
        }));
    } catch (error) {
        console.error('获取导航站点出错:', error);
    }
};

const cards = ref([
])

// 添加新的响应式变量
const cardContainer = ref(null);
const cardsPerRow = ref(0);
const showThumbnails = ref(false);

// 计算可见卡片和隐藏卡片
const visibleCards = computed(() => {
    const visibleCount = cardsPerRow.value * 2; // 两行卡片
    return cards.value.slice(0, visibleCount);
});

const hiddenCards = computed(() => {
    const visibleCount = cardsPerRow.value * 2; // 两行卡片
    return cards.value.slice(visibleCount);
});

// 切换缩略图显示状态
const toggleThumbnails = () => {
    showThumbnails.value = !showThumbnails.value;
};

// 计算每行可以容纳多少个卡片
const calculateCardsPerRow = () => {
    if (!cardContainer.value) return;

    const containerWidth = cardContainer.value.clientWidth;
    const cardWidth = 15 * 16; // 15rem转换为像素 (假设1rem = 16px)
    const gap = 2 * 16; // 2rem的间隙

    // 每行可容纳的卡片数 = 容器宽度 / (卡片宽度 + 间隙)
    const count = Math.floor((containerWidth + gap) / (cardWidth + gap));
    cardsPerRow.value = Math.max(1, count);
};

// 监听窗口大小变化
const handleResize = () => {
    calculateCardsPerRow();
};

// 在组件挂载后计算每行卡片数量
onMounted(() => {
    fetchNavigations();
    nextTick(() => {
        calculateCardsPerRow();
        window.addEventListener('resize', handleResize);
    });
});

// 在组件卸载前移除事件监听
const beforeUnmount = () => {
    window.removeEventListener('resize', handleResize);
};

// 当卡片数据变化时，可能需要重新计算
watch(cards, () => {
    nextTick(calculateCardsPerRow);
});
</script>

<style scoped>
.noStyle {
    border: none;
    background: none;
    outline: none;
    color: white;
    font-size: 1rem;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    line-height: 1.5;
    margin: 0.75rem 0 0 0;
    padding: 0;
    text-align: left;
    /* 居中填写 */

}

.noStyleButton {
    border: none;
    background: none;
    outline: none;
    color: white;
    font-size: 1rem;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    line-height: 1.5;
    margin: 0.75rem 0 0 0;
    padding: 0;
    text-align: left;

}

.card-container {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    justify-content: center;
    margin: 1rem;
    margin-top: 4rem;
}

.card {
    position: relative;
    /* 添加相对定位，用于放置删除按钮 */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 15rem;
    height: 12rem;
    padding: 1.5rem 0;
    text-decoration: none;

    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;

    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.2),
        inset 0 1px 1px rgba(255, 255, 255, 0.1);

    transition: all 0.3s ease;
}

/* 删除按钮样式 */
.delete-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.3s ease, background-color 0.3s ease;
    z-index: 10;
}

.card:hover .delete-btn {
    opacity: 1;
}

.delete-btn:hover {
    background: rgba(255, 59, 48, 0.8);
    color: white;
}

.card:hover {
    transform: translateY(-0.5rem);
    box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.3),
        inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

.card-image {
    width: 3.5rem;
    height: 3.5rem;
    margin-bottom: 1.5rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    transition: transform 0.3s ease;
}

.card:hover .card-image {
    transform: scale(1.1);
}

.card-body {
    text-align: center;
    width: 100%;
}

.card-title {
    color: rgba(255, 255, 255, 0.95);
    font-family: "Inter", sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.card-desc {
    color: rgba(255, 255, 255, 0.6);
    font-family: "Inter", sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    margin: 0.75rem 0 0 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* 添加卡片样式 */
.add-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: default;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.07);
    position: relative;
    overflow: hidden;
}

.add-card:hover {
    background: rgba(255, 255, 255, 0.1);
}

.add-card-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1rem;
    margin-top: 1rem;
}

.add-card-title {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1.1rem;
    font-weight: 500;
    margin: 0;
    letter-spacing: 0.5px;
}

.add-card-icon {
    width: 3rem;
    height: 3rem;
    margin-bottom: 0.5rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.add-card-title {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    font-weight: 300;
    margin: 0;
}

.add-card-form {
    width: calc(100% - 3rem);
}

.form-group {
    margin-bottom: 0.75rem;
}

.form-input {
    width: 100%;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 0px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    color: white;
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

.form-input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
}

.form-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 1rem;
}

.upload-btn,
.submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.7rem;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.3s ease;
}

.upload-btn {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
    border: none;
}

.upload-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.upload-btn:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
    cursor: not-allowed;
}

.btn-icon {
    margin-right: 0.5rem;
    font-size: 1rem;
}

.submit-btn {
    background: rgba(0, 122, 255, 0.7);
    color: white;
}

.submit-btn:hover {
    background: rgba(0, 122, 255, 0.9);
}

/* 添加新的样式 */
.thumbnail-toggle {
    margin-left: 6rem;
    margin-right: 6rem;
    width: 100%;
    text-align: center;
    padding: 1rem 0;
    margin-top: 1rem;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0.5rem;
    transition: all 0.3s ease;
}

.thumbnail-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
}

.thumbnail-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: flex-start;

    width: 100%;
    margin: 6rem;
    margin-top: 1rem;
}

.thumbnail-card {
    display: flex;
    align-items: center;
    width: calc(20% - 0.8rem);
    height: 4rem;
    padding: 1.5rem;
    text-decoration: none;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0.5rem;
    transition: all 0.3s ease;
}

.thumbnail-card:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-0.25rem);
}

.thumbnail-image {
    width: 2rem;
    height: 2rem;
    margin-right: 0.5rem;

}

.thumbnail-title {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1.2rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
    .thumbnail-card {
        width: calc(33.333% - 0.67rem);
    }
}

@media screen and (max-width: 480px) {
    .thumbnail-card {
        width: calc(50% - 0.5rem);
    }
}

/* 添加悬浮卡片相关样式 */
.floating-card {
    position: fixed;
    z-index: 1000;
    width: 54px;
    height: 54px;
    border-radius: 50%;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    user-select: none;
    -webkit-user-select: none;
}


.card-expanded {
    width: 15rem;
    height: auto;
    border-radius: 1rem;
    overflow: visible;
}

.card-handle {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 24px;
    cursor: move;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    z-index: 10;
    /* 确保在最上层 */
    user-select: none;
    -webkit-user-select: none;
    border-radius: 1rem;
}

.handle-dots {
    width: 30px;
    height: 4px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 2px;
}

.add-card-toggle {
    position: absolute;
    top: 30px;
    left: 0;
    width: 100%;
    height: 30%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.9);
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    transition: opacity 0.3s;
}

.card-expanded .add-card-toggle {
    width: 36px;
    height: 36px;
    top: 24px;
    right: 8px;
    left: auto;
    font-size: 20px;
}

.card-expanded .add-card-form {
    padding: 32px 16px 16px 16px;
}

/* 修改添加卡片样式 */
.add-card {
    background: rgba(9, 107, 253, 1);
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: default;
}

.add-card:hover {
    background: rgb(29, 30, 54, 1);
}
</style>