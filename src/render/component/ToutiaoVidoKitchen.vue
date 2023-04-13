<template>
    <a-row>
        <a-table :columns="columns" :data-source="videoData">
            <template v-slot:action="{record}">
                <span>
                    <a @click="deleteFile(record.videoName)">删除</a>
                    <a-divider type="vertical"/>
                    <a v-if="record.type === 'audio'" @click="transferToMp3(record.videoName)">转成mp3</a>
                    <a v-else @click="mergeVideo(record.videoName)">合成完整视频</a>
                </span>
            </template>
        </a-table>
    </a-row>
</template>
<script>
export default {
    name: 'ToutiaoVideoKitchen',
    props: {
        videoFileNames: Array,
        type: String
    },
    data() {
        return {
            columns: [
                {
                    dataIndex: "videoName",
                    title: "视频名称"
                },
                {
                    key: "action",
                    slots: {
                        customRender: 'action'
                    },
                }],
            videoData: []
        }
    },
    mounted() {
        this.videoData = this.videoFileNames.map(({fileName, type}, idx) => {
            return {
                key: idx,
                videoName: fileName,
                type
            }
        })
    },
    methods: {
        async transferToMp3(fileName) {
            console.log(`${fileName}.mp3`)
        },
        async mergeVideo(fileName) {
            console.log(`${fileName}.mm`)
        },
        async deleteFile(fileName) {
            console.log(`delete ${fileName}`)
        }
    }
}
</script>