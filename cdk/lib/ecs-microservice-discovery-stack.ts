import * as cdk from '@aws-cdk/core';
import {
    Cluster,
    ContainerImage,
    FargatePlatformVersion,
    FargateService,
    FargateTaskDefinition,
    LogDriver,
    Protocol
} from "@aws-cdk/aws-ecs";
import {Port, SubnetType, Vpc} from "@aws-cdk/aws-ec2";
import * as path from "path";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {DnsRecordType, PrivateDnsNamespace, Service} from "@aws-cdk/aws-servicediscovery";
import {Construct, Duration} from "@aws-cdk/core";
import {TokenMicroservice} from "./TokenMicroservice/TokenMicroservice";
import {AuthMicroservice} from "./AuthMicroservice/AuthMicroservice";

export class EcsMicroserviceDiscoveryStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new Vpc(this, 'VPC', {
            cidr: '10.0.0.0/21',
            subnetConfiguration: [
                {
                    subnetType: SubnetType.PUBLIC,
                    name: "Ingress",
                    cidrMask: 24,
                }
            ]
        })
        const cluster = new Cluster(this, 'Cluster', {
            vpc,
            capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
        });

        const cloudMapNamespace = new PrivateDnsNamespace(this, 'PrivateDnsNamespace', {
            name: 'myapp',
            vpc,
        })

        new TokenMicroservice(this, 'TokenMicroservice', {
            cluster,
            cloudMapNamespace,
        });

        new AuthMicroservice(this, 'AuthMicroservice', {
            cluster,
            cloudMapNamespace,
        });

    }
}
