import { CustomProviderConfig, findCustomModel, getCustomModelOptions } from './customModels';
import { AVAILABLE_MODELS, getModelById } from './models';

export const getModelOptions = (customProviders: CustomProviderConfig[]) => {
    const customModels = getCustomModelOptions(customProviders);
    return {
        builtIn: AVAILABLE_MODELS,
        custom: customModels,
        all: [...AVAILABLE_MODELS, ...customModels],
    };
};

export const getModelDisplayName = (modelId: string, customProviders: CustomProviderConfig[]) => {
    const fixedModel = getModelById(modelId);
    if (fixedModel) return fixedModel.displayName;

    const customModel = findCustomModel(customProviders, modelId);
    if (customModel) {
        const providerName = customModel.provider.name || 'Custom';
        return `${customModel.modelName} (${providerName})`;
    }

    return modelId;
};
