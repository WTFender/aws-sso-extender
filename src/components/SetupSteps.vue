<!-- eslint-disable max-len -->
<template>
  <div
    class="card"
    style="padding-left: 20px;"
  >
    <h2>
      <img
        alt="AWS SSO Extender"
        src="icons/128.png"
        width="25"
        style="vertical-align:middle;"
      >
      Setup
    </h2>
    <Accordion style="padding-right: 20px; padding-bottom: 20px;">
      <AccordionTab :disabled="permissions.origins">
        <template #header>
          <div style="width: 90%">
            <span style="margin-left: 5px;">Required Permissions</span>
          </div>
          <div style="width: 10%">
            <i
              class="pi"
              :class="permissions.origins === true ? 'pi-check-circle' : 'pi-exclamation-circle'"
              :style="permissions.origins === true ? 'color: green;' : 'color: orange;'"
            />
          </div>
        </template>
        <p>This extension requires access to awsapps.com.</p>
        <PrimeButton
          size="small"
          class="p-button-success"
          label="Request Permissions"
          @click="requestPermissions()"
        />
        <!--- TODO add granular site perms options --->
      </AccordionTab>

      <AccordionTab :disabled="loaded">
        <template #header>
          <div style="width: 90%">
            <span style="margin-left: 5px;">Login to AWS SSO</span>
          </div>
          <div style="width: 10%">
            <i
              class="pi"
              :class="loaded === true ? 'pi-check-circle' : 'pi-exclamation-circle'"
              :style="loaded === true ? 'color: green;' : 'color: orange;'"
            />
          </div>
        </template>
        <p>Login to AWS SSO to populate your profiles. Your login link typically looks like this:</p>
        <pre>
  companyName.awsapps.com/start#/
  directoryId.awsapps.com/start#/
          </pre>
        <Divider
          v-if="!permissions.history"
          align="left"
          type="solid"
        >
          <small>Optional</small>
        </Divider>
        <LoginLinks :permissions="permissions" />
      </AccordionTab>
    </Accordion>
    <PrimeButton
      size="small"
      class="p-button-primary"
      label="Demo Mode"
      style="margin-right: 5px;"
      @click="$emit('demoMode')"
    />
    <PrimeButton
      v-if="$ext.config.debug"
      size="small"
      class="p-button-secondary"
      label="Skip Setup"
      @click="$emit('skipSetup')"
    />
  </div>
</template>

<script>
export default {
  name: 'SetupSteps',
  props: {
    loaded: {
      required: true,
      type: Boolean,
      default: false,
    },
    permissions: {
      required: true,
      type: Object,
      default: () => ({
        origins: false,
        history: false,
      }),
    },
  },
  emits: ['skipSetup', 'demoMode'],
  methods: {
    requestPermissions() {
      this.$ext.requestOrigins();
      window.close();
    },
  },
};
</script>

  <style lang="scss" scoped>
  </style>
