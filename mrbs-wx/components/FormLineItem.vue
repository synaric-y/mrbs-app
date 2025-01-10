<script setup>
	defineProps({
		label:{ // 标题
			type: String
		},
		isLink:{ // 有右箭头
			type: Boolean,
			default: false
		},
		isSecondary:{ // 是二级菜单
			type: Boolean,
			default: false
		}
	})
	defineEmits(['activate'])
</script>

<template>
	<div class="form-item">
		<label :class="isSecondary?'title title-right':'title'">{{label}}</label>
		<div class="form-item-right" @click="$emit('activate')">
			<div class="form-right-container">
				<slot></slot>
			</div>
			<!-- <uni-icons class="form-right-icon" v-if="isLink" type="right" size="20"></uni-icons> -->
		</div>
	</div>
</template>

<style scoped lang="scss">

	.form-item {
		display: flex;
		gap: 1rem;
		// height: 3rem;
		align-items: center;
		flex-direction: row;
		justify-content: space-between;
		font-size: 1rem;
		// border-bottom: 0.05rem solid var(--color-border);
	
		.title {
			// font-weight: 700;
			// font-size: 0.85rem;
			// color: var(--color-text);
			// min-width: 4rem;
			// white-space: nowrap;
			cursor: default;
			min-width: 5rem;
		}
		
		.title-right{
			text-align: right;
			min-width: 7rem;
		}
	
		.form-item-right {
			display: flex;
			width: 100%;
			gap: 0.3rem;
			height: 32px;
			align-items: center;
			flex-direction: row;
			color: var(--color-regular-text);
			cursor: pointer;
			position: relative;
			
			.form-right-container {
				overflow: hidden;
				text-align: right;
				width: 100%;
				z-index: 31;
			}
			
			.form-right-icon{
				position: absolute;
				right: 0;
				top: 0;
				color:var(--color-regular-text);
				z-index: 29;
			}
	
		}
		
	}
</style>