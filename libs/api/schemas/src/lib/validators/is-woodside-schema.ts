import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { has as _has, isEmpty as _isEmpty, get as _get } from 'lodash';

export function IsValidWoodsideSchema(validationOptions?: ValidationOptions) {
    const valueExists = (object: any, propertyPath: string) =>
        _has(object, propertyPath) && !_isEmpty(_get(object, propertyPath));

    const getDataDefinition = (locationReference: string) => {
        const re = new RegExp('/', 'g');
        return locationReference.replace('#/', '').replace(re, '.');
    };

    let errors: string[] = [];

    return function (object: any, propertyName: string) {
        registerDecorator({
            name: 'isValidWoodsideSchema',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,

            validator: {
                validate(value: string, args: ValidationArguments) {
                    errors = [];

                    if (!value) {
                        return false;
                    }

                    const content = JSON.parse(value);

                    if (!valueExists(content, 'properties')) {
                        errors.push('Missing properties');
                    } else {
                        if (!valueExists(content, 'properties.account')) {
                            errors.push('Missing account property');
                        }
                        if (!valueExists(content, 'properties.detail')) {
                            errors.push('Missing detail property');
                        }
                        if (!valueExists(content, 'properties.detail-type')) {
                            errors.push('Missing detail type property');
                        }
                        if (!valueExists(content, 'properties.id')) {
                            errors.push('Missing id property');
                        }
                        if (!valueExists(content, 'properties.region')) {
                            errors.push('Missing region property');
                        }
                        if (!valueExists(content, 'properties.resources')) {
                            errors.push('Missing resources property');
                        }
                        if (!valueExists(content, 'properties.source')) {
                            errors.push('Missing source property');
                        }
                        if (!valueExists(content, 'properties.time')) {
                            errors.push('Missing time property');
                        }
                    }

                    if (!valueExists(content, 'properties.detail.properties')) {
                        errors.push('Missing WoodsideEvent definition');
                    } else {
                        if (!valueExists(content, 'properties.detail.properties.Data')) {
                            errors.push('Missing Data property');
                        } else {
                            // const dataDefinitionLocation = content.properties.detail.properties.Data;
                            // if (!valueExists(content, dataDefinitionLocation) && dataDefinitionLocation.type === "string") {
                            //     errors.push('Missing Data Definition');
                            // }
                        }
                        if (!valueExists(content, 'properties.detail.properties.Metadata')) {
                            errors.push('Missing Metadata property');
                        } else {
                            if (!valueExists(content, 'properties.detail.properties.Metadata.properties.Guid')) {
                                errors.push('Missing Metadata.Guid property');
                            }
                            if (!valueExists(content, 'properties.detail.properties.Metadata.properties.Time')) {
                                errors.push('Missing Metadata.Time property');
                            }
                            if (!valueExists(content, 'properties.detail.properties.Metadata.properties.Version')) {
                                errors.push('Missing Metadata.Version property');
                            }
                        }
                    }

                    return !errors.length;
                },
                defaultMessage(args: ValidationArguments) {
                    return errors.length
                        ? `${args.property} is missing the following fields: \n ${errors.join('\n')}`
                        : `${args.property} should not be empty`;
                },
            },
        });
    };
}
