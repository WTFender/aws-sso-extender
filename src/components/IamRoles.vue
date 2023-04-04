<!-- eslint-disable max-len -->
<template>
  <div style="margin-bottom: 10px;">
    <h3>Assume IAM Roles via SSO Profiles</h3>
    <small id="arn-help">Enter the target AWS IAM Role ARN</small>
    <InputText id="iamRoleArn" v-model="newIamRole.arn" name="arn" class="p-inputtext-sm" aria-describedby="arn-help"
      style="width: 400px" placeholder="arn:aws:iam::123412341234:role/roleName" />
  </div>
  <small id="label-help">Role label and color for the AWS console</small>
  <div style="margin-bottom: 10px;">
    <InputText id="iamRoleLabel" v-model="newIamRole.label" name="label" class="p-inputtext-sm"
    style="width: 350px; margin-right: 10px;" placeholder="roleName" aria-describedby="label-help"/>
    <ColorPicker @click="colorPickerVisible = !colorPickerVisible" v-model="newIamRole.color" />
  </div>
  <PDialog v-if="$ext.platform === 'firefox'" v-model:visible="colorPickerVisible" :style="{ width: '50vw' }">
    <ColorPicker v-if="colorPickerVisible" :inline="true" v-model="newIamRole.color" />
  </PDialog>
  <small id="profiles-help">Select the SSO profiles that can assume this IAM role</small>
  <PListbox v-model="selectedProfiles" id="awsAppProfiles" :options="awsAppProfiles" class="w-full md:w-14rem"
    style="margin-bottom: 15px" listStyle="max-height:150px" multiple>
    <template #option="slotProps">
        <div class="flex align-items-center" style="max-height: 30px; line-height: 0; padding: 0px; margin: 0px;">
          <small>{{ slotProps.option.label }}</small>
        </div>
    </template>
  </PListbox>
  <PrimeButton size="small" icon="pi pi-user-plus" class="p-button-primary" label="Add IAM Role" style="margin-right: 10px"
    @click="addIamRole()" />
  <PrimeButton size="small" icon="pi pi-trash" class="p-button-danger" label="Reset IAM Roles" @click="resetIamRoles()" />
</template>

<script lang="ts">
import { AppData, IamRole } from '../types';

export default {
  name: 'IamRoles',
  props: {
    appProfiles: {
      required: true,
      type: Array<AppData>,
    },
  },
  emits: ['addIamRole', 'saveUser', 'updateProfile', 'setPage'],
  data() {
    return {
      colorPickerVisible: false,
      selectedProfiles: [] as AppData[],
      newIamRole: {
        arn: '',
        label: '',
        color: '#222f3e',
        accountId: '',
        roleName: '',
      },
    };
  },
  computed: {
    awsAppProfiles(): AppData[] {
      const appProfiles = this.appProfiles.filter((ap) => (ap as AppData).applicationName === 'AWS Account') as AppData[];
      // eslint-disable-next-line no-param-reassign
      appProfiles.forEach((ap) => { ap.label = `${ap.searchMetadata!.AccountId} (${ap.searchMetadata!.AccountName}) - ${ap.profile.name}`; });
      this.$ext.log(appProfiles);
      return appProfiles;
    },
  },
  created() {
    //
  },
  methods: {
    setColor() {
      const color = document.getElementById('color') as HTMLInputElement;
      this.$ext.log(color);
      this.colorPickerVisible = false
      this.newIamRole.color = color.value;
    },
    resetIamRoles() {
      this.appProfiles.forEach(ap => {
        ap.profile!.custom!.iamRoles = [];
        this.$emit('updateProfile', ap);
      });
    },
    invalid(id){
      const el = document.getElementById(id);
      if(el){ el.classList.add('p-invalid') };
      setTimeout(() => {
        el!.classList.remove("p-invalid");
      }, 5000);
    },
    validateNewIamRole(): boolean {
      if (this.newIamRole.arn.startsWith('arn:aws:iam::')) {
        const accountId = this.newIamRole.arn.split(':')[4];
        const roleName = this.newIamRole.arn.split('/')[1];
        if (accountId == undefined || roleName === undefined){
          // bad arn format
          this.invalid('iamRoleArn')
          return false
        }
        if (this.selectedProfiles.length === 0){
          // need to select at least 1 profile
          this.invalid('awsAppProfiles')
          return false
        }
        this.newIamRole.accountId = accountId;
        this.newIamRole.roleName = roleName;
        return true
      }
      this.invalid('iamRoleArn')
      return false
    },
    addIamRole() {
      if (this.validateNewIamRole()){
        this.selectedProfiles.forEach(ap => {
          this.$emit('addIamRole', {
            profileId: ap.profile.id,
            accountId: this.newIamRole.accountId,
            roleName: this.newIamRole.roleName,
            color: this.newIamRole.color.replace('#', ''),
            label: this.newIamRole.label,
          });
        })
        this.$emit('saveUser');
        this.$emit('setPage', 'profiles');        
      }
    },
  },
};
</script>

<style lang="scss" scoped></style>
