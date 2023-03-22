#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {LegacyAppStack} from '../lib/legacy-app-stack';
import {getConfig} from "./config";

const app = new cdk.App();
const options = getConfig();

new LegacyAppStack(app, 'LegacyAppStack', {
    options: options,
});
