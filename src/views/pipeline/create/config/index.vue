<template>
  <div class="bg-[#FFFFFF] rounded-[12px] leading-[24px] mx-20">
    <div class="bg-[#121211] p-4 rounded-tl-[12px] rounded-tr-[12px]">
      <div class="flex justify-between">
        <div class="text-[24px] font-semibold text-[#FFFFFF]">
          {{ templateInfo.name }}
        </div>
      </div>
      <div class="text-[#979797] text-[14px] mt-2">
        {{ templateInfo.description }}
      </div>
    </div>
    <div
      class="p-4 rounded-bl-[12px] rounded-br-[12px] border border-solid border-[#EFEFEF] box-border"
    >
      <div class="mb-4 w-1/4">
        <div class="mb-2">
          Pipeline Name
        </div>
        <a-input v-model:value="PipelineName" placeholder="Pipeline Name" allow-clear />
      </div>
      <a-row class="create" :gutter="24">
        <a-col :span="8">
          <div class="bg-[#EFEFEF] p-4 rounded-tl-[12px] rounded-tr-[12px]">
            <div class="flex justify-between">
              <div class="text-[16px] font-semibold text-[#121211]">
                Pipeline Process
              </div>
            </div>
          </div>
          <div
            class="p-4 rounded-bl-[12px] rounded-br-[12px] border border-solid border-[#EFEFEF] box-border"
          >
            <a-form
              :label-col="{ xs: { span: 24 }, sm: { span: 7 } }"
              layout="vertical"
            >
              <div v-for="(data, key) in yamlList" :key="key">
                <div class="flex mb-4">
                  <div class="text-[#FFFFFF] bg-[#121211] rounded-[50%] h-[20px] w-[20px] text-center leading-[20px] text-[14px]">{{ key + 1 }}</div>
                  <div class="ml-2 text-[#121211] font-semibold">{{ data.stage }}</div>
                </div>
                <div v-for="(item, index) in data.steps" :key="index">
                  <div v-if="item.eleName === 'git-checkout'">
                    <GitCheckout :stage="data.stage" :index="index" :url="item.eleValues.url" :branch="item.eleValues.branch" @setYamlCode="setYamlCode"></GitCheckout>
                  </div>
                  <div v-else-if="item.eleName === 'artifactory'">
                    <Artifactory :stage="data.stage" :index="index" :name="item.eleValues.name" :path="item.eleValues.path" @setYamlCode="setYamlCode"></Artifactory>
                  </div>
                  <div v-else-if="item.eleName === 'shell'">
                    <Shell :stage="data.stage" :index="index" :run="item.eleValues.run" :runsOn="item.eleValues.runsOn" @setYamlCode="setYamlCode"></Shell>
                  </div>
                </div>
              </div>
            </a-form>
          </div>
        </a-col>
        <a-col :span="16">
          <CodeEditor :value="codeValue"></CodeEditor>
        </a-col>
      </a-row>
      <div class="text-center mt-8">
        <a-button type="primary" @click="lastStep" ghost>{{ $t("template.lastBtn") }}</a-button>
        <a-button type="primary" @click="submitData" class="ml-4">{{
          $t("template.submitBtn")
        }}</a-button>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref, onMounted } from "vue";
import YAML from "yaml";
import { useRoute, useRouter } from 'vue-router';
import { apiGetTemplatesById, apiAddPipeline } from "@/apis/template";
import CodeEditor from "./components/CodeEditor.vue";
import GitCheckout from "./components/GitCheckout.vue";
import Artifactory from "./components/Artifactory.vue";
import Shell from "./components/Shell.vue";
import { message } from "ant-design-vue";

  const codeValue = ref<String>(
    "version: 1.0\n" +
      "name: my-test\n" +
      "stages:\n" +
      "  git-clone:\n" +
      "    steps:\n" +
      "      - name: git-clone\n" +
      "        code: 1\n" +
      "        uses: git-checkout\n" +
      "        with:\n" +
      "          url: https://gitee.com/mohaijiang/spring-boot-example.git\n" +
      "          branch: master\n" +
      "  code-compile:\n" +
      "    needs:\n" +
      "      - git-clone\n" +
      "    steps:\n" +
      "      - name: code-compile\n" +
      "        code: 2\n" +
      "        runs-on: maven:3.5-jdk-8\n" +
      "        run: |\n" +
      "          mvn clean package -Dmaven.test.skip=true\n" +
      "      - name: save artifactory\n" +
      "        code: 2\n" +
      "        uses: hamster/artifactory\n" +
      "        with:\n" +
      "          name: some.zip\n" +
      "          path: contracts/*.sol\n" +
      "\n" +
      "  build-image:\n" +
      "    needs:\n" +
      "      - code-compile\n" +
      "    steps:\n" +
      "      - name: shell\n" +
      "        code: 3\n" +
      "        run: |\n" +
      "          docker build -t mohaijiang/spring-boot-example:20221109 ."
    );

  const router = useRouter();
  const { params } = useRoute();
  const templateId = ref(params.id);
  const templateInfo = reactive({});
  const yamlList = ref([]);
  const PipelineName = ref('');

  onMounted(async () => {
    getTemplatesById(templateId.value.toString());
  });
  
  const getTemplatesById = async (templateId: String) => {

    try {
      const data = await apiGetTemplatesById(templateId);
      Object.assign(templateInfo, data.template); //赋值
      PipelineName.value = templateInfo.name;
      // codeValue.value = templateInfo.yaml; //@todo mock数据显示有问题，暂时用临时数据
      
      const config  = YAML.parse(codeValue.value);
      for (let key in config["stages"]){
        let obj = config["stages"][key];
        let steps: { eleName: string; eleValues: {}; }[] = [];
        if (obj["steps"]){
          obj["steps"].forEach((item: { [x: string]: any; }) => {
            let eleName = '';
            let eleValues = {};
            if (item["uses"]) {
              if (item["uses"] === 'hamster/artifactory') {
                eleName = 'artifactory';
              } else {
                eleName = item["uses"];
              }
              eleValues = item["with"];
            } else {
              eleName = 'shell';
              eleValues = {
                run: item["run"],
                runsOn: item["runs-on"],
              };
            }
            steps.push({
              eleName: eleName,
              eleValues: eleValues,
            });
          });
        }
        const yaml = {
          stage: key,
          steps: steps,
        }
        yamlList.value.push(yaml);
      }
    } catch (error: any) {
      console.log("erro:",error)
    }
  };
  const lastStep = async () => {
    router.push({ path: '/create' });
  }

  const submitData = async () => {
    try {
      if (PipelineName.value === "" || PipelineName.value === null) {
        message.error("Please input Pipeline Name");
        return false;
      }
      //@todo 添加PipelineName.value判重
      const result = await apiAddPipeline(PipelineName.value, codeValue.value);
      console.log("result:", result)
      if (result.code === 200) {
        message.success(result.message);
        router.push({ path: '/pipeline' });
      }
    } catch (error: any) {
      console.log("erro:", error);
      message.error("Failed");
    }
  }

  const setYamlCode = async (isUsers: any, key: string, index: number, item: string, val: any) => {
    const config = YAML.parse(codeValue.value);
    if (isUsers) {
      config["stages"][key]["steps"][index]["with"][item] = val;
    } else {
      config["stages"][key]["steps"][index][item] = val;
    }

    codeValue.value = YAML.stringify(config)
  }
</script>
<style scoped lang="less">
.create {
  height: 100%;
}
@baseColor: #28c57c;
:deep(.ant-btn) {
  border-radius: 6px;
}
:deep(.ant-btn-primary) {
  width: 120px;
  height: 40px;
}
:deep(.ant-btn-primary), :deep(.ant-btn-primary:hover), :deep(.ant-btn-primary:focus){
  border-color: @baseColor;
  background: @baseColor;
}
:deep(.ant-btn-background-ghost.ant-btn-primary), :deep(.ant-btn-background-ghost.ant-btn-primary:hover), :deep(.ant-btn-background-ghost.ant-btn-primary:focus){
  border-color: @baseColor;
  color: @baseColor;
}
:deep(.ant-input),:deep(.ant-input-affix-wrapper){
  border-color: #EFEFEF;
  border-radius: 6px;
}
@placeholderColor: #BCBEBC;
:deep(input::-webkit-input-placeholder) { /* WebKit browsers */
  color: @placeholderColor;
}
:deep(input:-moz-placeholder) { /* Mozilla Firefox 4 to 18 */
  color: @placeholderColor;
}
:deep(input::-moz-placeholder) { /* Mozilla Firefox 19+ */
  color: @placeholderColor;
}
:deep(input:-ms-input-placeholder) { /* Internet Explorer 10+ */
  color: @placeholderColor;
}
</style>
