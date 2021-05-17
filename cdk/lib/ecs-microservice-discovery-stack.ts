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

        this.createTokenService(cluster, cloudMapNamespace);
        this.createAuthService(cluster, cloudMapNamespace);
    }

    private createTokenService(cluster: Cluster, cloudMapNamespace: PrivateDnsNamespace) {
        const context = new Construct(this, 'Token');
        const taskDefinition = new FargateTaskDefinition(context, 'FargateTaskDefinition', {
            memoryLimitMiB: 512,
            cpu: 256,
        });
        taskDefinition.addContainer("web", {
            // Use an image from DockerHub
            image: ContainerImage.fromAsset(path.resolve(__dirname, "./token")),
            portMappings: [
                {
                    containerPort: 80,
                    protocol: Protocol.TCP,
                    hostPort: 80,
                },
            ],
            logging: LogDriver.awsLogs({
                logRetention: RetentionDays.ONE_MONTH,
                streamPrefix: "web",
            }),
        });

        const service = new FargateService(context, 'FargateService', {
            cluster,
            taskDefinition,
            assignPublicIp: true,
            platformVersion: FargatePlatformVersion.VERSION1_4,
            maxHealthyPercent: 300,
            minHealthyPercent: 100,
            capacityProviderStrategies: [
                {
                    capacityProvider: 'FARGATE_SPOT',
                    weight: 2,
                },
                {
                    capacityProvider: 'FARGATE',
                    weight: 1,
                }
            ],
        });

        const cloudMapService = cloudMapNamespace.createService('token', {
            dnsRecordType: DnsRecordType.A,
            dnsTtl: Duration.seconds(1),
            name: 'token',
        });
        service.associateCloudMapService({
            service: cloudMapService,
        })

        service.connections.allowFromAnyIpv4(Port.allTraffic());
    }

    private createAuthService(cluster: Cluster, cloudMapNamespace: PrivateDnsNamespace) {
        const context = new Construct(this, 'Auth');
        const taskDefinition = new FargateTaskDefinition(context, 'FargateTaskDefinition', {
            memoryLimitMiB: 512,
            cpu: 256,
        });
        taskDefinition.addContainer("web", {
            // Use an image from DockerHub
            image: ContainerImage.fromAsset(path.resolve(__dirname, "./auth")),
            portMappings: [
                {
                    containerPort: 80,
                    protocol: Protocol.TCP,
                    hostPort: 80,
                },
            ],
            logging: LogDriver.awsLogs({
                logRetention: RetentionDays.ONE_MONTH,
                streamPrefix: "web",
            }),
        });

        const service = new FargateService(context, 'FargateService', {
            cluster,
            taskDefinition,
            assignPublicIp: true,
            platformVersion: FargatePlatformVersion.VERSION1_4,
            maxHealthyPercent: 300,
            minHealthyPercent: 100,
            capacityProviderStrategies: [
                {
                    capacityProvider: 'FARGATE_SPOT',
                    weight: 2,
                },
                {
                    capacityProvider: 'FARGATE',
                    weight: 1,
                }
            ],
        });

        const cloudMapService = cloudMapNamespace.createService('auth', {
            dnsRecordType: DnsRecordType.A,
            dnsTtl: Duration.seconds(1),
            name: 'auth',
        });
        service.associateCloudMapService({
            service: cloudMapService,
        })

        service.connections.allowFromAnyIpv4(Port.allTraffic());
    }
}
