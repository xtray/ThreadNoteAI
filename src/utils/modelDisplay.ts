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

export const getProvisionedModelOptions = ({
    apiKeys,
    customProviders,
}: {
    apiKeys: Record<string, string>;
    customProviders: CustomProviderConfig[];
}) => {
    const builtIn = AVAILABLE_MODELS.filter((model) => (apiKeys[model.providerId] || '').trim().length > 0);
    const provisionedCustomProviders = customProviders.filter((provider) =>
        provider.baseUrl.trim().length > 0
        && provider.apiKey.trim().length > 0
        && provider.models.some((modelName) => modelName.trim().length > 0)
    );
    const custom = getCustomModelOptions(provisionedCustomProviders);

    return {
        builtIn,
        custom,
        all: [...builtIn, ...custom],
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
