<!-- eslint-disable max-len -->
<template>
  <div>
    <h3>Assume IAM Roles via SSO Profiles</h3>
    <small id="arn-help">Enter the target AWS IAM Role ARN</small>
    <InputText id="iamRoleArn" v-model="newIamRole.arn" name="arn" class="p-inputtext-sm" aria-describedby="arn-help"
      style="width: 400px" placeholder="arn:aws:iam::123412341234:role/roleName" />
    <br>
    
  </div><br>
  
  <small id="profiles-help">Select the SSO profiles that can assume this IAM role</small>
  <MultiSelect v-model="newIamRole.profiles" filter :options="awsAppProfiles" id= "awsAppProfiles" name="awsAppProfiles" option-label="label"
    placeholder="Select SSO Profiles" display="chip" class="w-full md:w-20rem" aria-describedby="profiles-help"
    style="width: 400px" />
  <br><br>
  <small id="label-help">Session label and color for the AWS console</small>
  <InputText id="iamRoleLabel" v-model="newIamRole.label" name="label" class="p-inputtext-sm"
    style="width: 350px; margin-right: 10px;" placeholder="{{role}} @ {{account}} via {{profile}}" aria-describedby="label-help"/>
  <ColorPicker v-model="newIamRole.color" />
  <br><br><br>
  <PrimeButton size="small" icon="pi pi-user-plus" class="p-button-primary" label="Add IAM Role" style="margin-right: 5px"
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
  emits: ['updateProfiles', 'updateProfile', 'setPage'],
  data() {
    return {
      newIamRole: {
        arn: '',
        profiles: [],
        label: '',
        color: '#22C55E',
        accountId: '',
        roleName: '',
      },
      selectedProfiles: [],
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
    resetIamRoles() {
      this.appProfiles.forEach(ap => {
        ap.profile!.custom!.iamRoles = [];
        this.$emit('updateProfile', ap);
      });
    },
    invalid(id){
      const el = document.getElementById(id);
      if(el){ el.classList.add('p-invalid') };
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
        if (this.newIamRole.profiles.length === 0){
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
        const appProfiles: AppData[] = [];
        this.newIamRole.profiles.forEach((appProfile: AppData) => {
          const iamRole = {
            profileId: appProfile.profile.id,
            accountId: this.newIamRole.accountId,
            roleName: this.newIamRole.roleName,
            color: this.newIamRole.color.replace('#', ''),
            label: this.newIamRole.label,
          };
          appProfile.profile.custom!.iamRoles!.push(iamRole);
          appProfiles.push(appProfile);
        });
        this.$emit('updateProfiles', appProfiles);
        this.$emit('setPage', 'profiles');
      }
    },
  },
};
</script>

<style lang="scss" scoped></style>
