#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {EcsMicroserviceDiscoveryStack} from '../lib/ecs-microservice-discovery-stack';

const app = new cdk.App();
new EcsMicroserviceDiscoveryStack(app, 'EcsMicroserviceDiscoveryStack', {});
