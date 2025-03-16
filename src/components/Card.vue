<template>
    <div class="card-container">
        <a v-for="card in cards" :key="card.id" :href="formatUrl(card.url)" target="_blank" class="card">
            <img :src="getImageUrl(card.img)" alt="card image" class="card-image" />
            <div class="card-body">
                <h3 class="card-title">{{ card.title }}</h3>
                <p class="card-desc">{{ card.desc }}</p>
            </div>
        </a>
        <a class="card" style="border-radius: 10%;">

            <img src="../assets/Upload.svg" alt="Upload" class="card-image"
                style="width: 6rem;height: 6rem;margin-bottom: 0;" @click="submitForm" />

            <!-- 居中填写 -->

            <input class="noStyle" placeholder="标题" v-model="newCard.name" />
            <input class="noStyle" placeholder="描述" v-model="newCard.description" />
            <input class="noStyle" placeholder="url" v-model="newCard.url" />
            <button class="noStyleButton" @click="triggerFileUpload">SVG</button>
            <input type="file" ref="fileInput" style="display: none;" @change="handleFileUpload" accept="image/*" />


        </a>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import Google from '../assets/Google.svg';
import GitHub from '../assets/GitHub.svg';
import Email from '../assets/Email.svg';
import DouYin from '../assets/DouYin.svg';
import ZhiHu from '../assets/ZhiHu.svg';
import PinDD from '../assets/PinDD.svg';
import Bilibili from '../assets/BiliBili.svg';
import { get, post, upload, getImageUrl, formatUrl } from '../utils/api';



const fileInput = ref(null);
const isUploading = ref(false);
const newCard = ref({
    name: '',
    description: '',
    url: '',
    logo: ''
});
const isSubmitting = ref(false);



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
    const result = await post('/api/navigation', cardData);
    console.log('卡片添加成功:', result);
    fetchNavigations();
    window.$message.success('操作成功')
    
  } catch (error) {
    console.error('提交出错:', error);
    alert('提交失败，请重试');
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
    newCard.value.logo = result.file.path;
    
    alert('图标上传成功！');
  } catch (error) {
    console.error('上传出错:', error);
    alert('上传失败，请重试');
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
});
// 获取所有导航站点
const fetchNavigations = async () => {
  try {
    const data = await get('/api/navigation');
    console.log('获取导航站点成功:', data);
    
    // 将API返回的数据转换为cards数组格式
    cards.value = data.map(item => ({
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
    {
        id: 1,
        img: Google,
        title: '谷歌',
        desc: '搜索引擎',
        url: 'https://www.google.com'
    },
    {
        id: 2,
        img: GitHub,
        title: 'GitHub',
        desc: '代码托管',
        url: 'https://www.github.com'
    },
    {
        id: 3,
        img: Email,
        title: '网易邮箱',
        desc: '163邮箱',
        url: 'https://mail.163.com'
    },
    {
        id: 4,
        img: DouYin,
        title: '抖音',
        desc: '短视频平台',
        url: 'https://www.douyin.com'
    },

    {
        id: 6,
        img: ZhiHu,
        title: '知乎',
        desc: '知识分享社区',
        url: 'https://www.zhihu.com'
    },
    {
        id: 7,
        img: PinDD,
        title: '拼多多',
        desc: '电商平台',
        url: 'https://www.pinduoduo.com'

    },
    {
        id: 8,
        img: Bilibili,
        title: '哔哩哔哩',
        desc: '弹幕视频网站',
        url: 'https://www.bilibili.com'
    }





    // 可以继续添加更多卡片数据...

])
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
    margin-top: 4rem;
}

.card {
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
</style>