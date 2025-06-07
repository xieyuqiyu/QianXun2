<template>
    <div class="card-container">
         <div class="card add-card">

            <div class="add-card-form">
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
                        <span>{{ isEdit?'更新':'添加' }}</span>
                    </button>
                </div>
            </div>
        </div>
        <a v-for="card in cards" :key="card.id" :href="formatUrl(card.url)" target="_blank" class="card">
            <!-- 添加删除按钮 -->
            <div class="delete-btn" style="right: 40px;" @click.stop.prevent="editInfo(card)">/</div>
            <div class="delete-btn" @click.stop.prevent="confirmDelete(card.id)">X</div>
            <img :src="getImageUrl(card.img)" alt="card image" class="card-image" />
            <div class="card-body">
                <h3 class="card-title">{{ card.title }}</h3>
                <p class="card-desc">{{ card.desc }}</p>
            </div>
        </a>
       
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { get, post, upload, del, getImageUrl, formatUrl,put } from '../utils/api';



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
    // {
    //     id: 1,
    //     img: Google,
    //     title: '谷歌',
    //     desc: '搜索引擎',
    //     url: 'https://www.google.com'
    // },
    // {
    //     id: 2,
    //     img: GitHub,
    //     title: 'GitHub',
    //     desc: '代码托管',
    //     url: 'https://www.github.com'
    // },
    // {
    //     id: 3,
    //     img: Email,
    //     title: '网易邮箱',
    //     desc: '163邮箱',
    //     url: 'https://mail.163.com'
    // },
    // {
    //     id: 4,
    //     img: DouYin,
    //     title: '抖音',
    //     desc: '短视频平台',
    //     url: 'https://www.douyin.com'
    // },

    // {
    //     id: 6,
    //     img: ZhiHu,
    //     title: '知乎',
    //     desc: '知识分享社区',
    //     url: 'https://www.zhihu.com'
    // },
    // {
    //     id: 7,
    //     img: PinDD,
    //     title: '拼多多',
    //     desc: '电商平台',
    //     url: 'https://www.pinduoduo.com'

    // },
    // {
    //     id: 8,
    //     img: Bilibili,
    //     title: '哔哩哔哩',
    //     desc: '弹幕视频网站',
    //     url: 'https://www.bilibili.com'
    // },
    // {
    //     id: 9,
    //     img: Xianyu,
    //     title: '闲鱼',
    //     desc: '江湖人称咸鱼',
    //     url: 'https://www.goofish.com/'
    // },
    // {
    //     id: 10,
    //     img: Taobao,
    //     title: '淘宝',
    //     desc: '买买买',
    //     url: 'taobao.com'
    // },
    // {
    //     id: 11,
    //     img: Jingdong,
    //     title: '京东',
    //     desc: '买买买',
    //     url: 'jd.com'
    // },
    // {
    //     id: 12,
    //     img: TapTap,
    //     title: 'TapTap',
    //     desc: '攻略站',
    //     url: 'https://www.taptap.cn/app/733083/strategy'
    // },
    // {
    //     id: 13,
    //     img: Netflix,
    //     title: '奈飞',
    //     desc: '看电视',
    //     url: 'https://www.netflix.com/'
    // },
    // {
    //     id: 14,
    //     img: Qidian,
    //     title: '起点',
    //     desc: '看小说',
    //     url: 'https://www.qidian.com/'
    // },
    // {
    //     id: 15,
    //     img: Miaoduo,
    //     title: '妙多',
    //     desc: '我的设计师工具',
    //     url: 'https://www.miaoduo.com/'
    // },
    // {
    //     id: 16,
    //     img: TencentDocs,
    //     title: '腾讯文档',
    //     desc: '写文档的地方',
    //     url: 'https://docs.qq.com/'
    // },
    // {
    //     id: 17,
    //     img: Coze,
    //     title: '扣子',
    //     desc: '搭建工作流网站',
    //     url: 'https://www.coze.cn/'
    // }
    





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
    width: 15rem;
    height: 14rem;
    cursor: default;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.07);
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

.upload-btn, .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
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
</style>