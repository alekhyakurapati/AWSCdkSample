/* eslint-disable */
export default {
    displayName: 'lambdas',
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    },
    transformIgnorePatterns: ['../../node_modules/azure-ad-verify-token'],
    testMatch: ['**/__tests__/**/*.[jt]s?(x)'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    coverageDirectory: '../../coverage/libs/lambdas',
    setupFiles: ['./jest.setup.js'],
};
