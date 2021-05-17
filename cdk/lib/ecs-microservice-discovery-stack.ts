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
import {Duration} from "@aws-cdk/core";

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

        this.createService(cluster, "1", cloudMapNamespace);
        this.createService(cluster, "2", cloudMapNamespace);
    }

    private createService(cluster: Cluster, suffix: string, cloudMapNamespace: PrivateDnsNamespace) {
        const taskDefinition = new FargateTaskDefinition(cluster, 'FargateTaskDefinition' + suffix, {
            memoryLimitMiB: 512,
            cpu: 256,
        });
        taskDefinition.addContainer("WebContainer", {
            // Use an image from DockerHub
            image: ContainerImage.fromAsset(path.resolve(__dirname, "./service" + suffix)),
            portMappings: [
                {
                    containerPort: 80,
                    protocol: Protocol.TCP,
                    hostPort: 80,
                },
            ],
            logging: LogDriver.awsLogs({
                logRetention: RetentionDays.ONE_MONTH,
                streamPrefix: "service" + suffix,
            }),
        });

        const service = new FargateService(cluster, 'FargateService' + suffix, {
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

        const cloudMapService = cloudMapNamespace.createService('service-' + suffix, {
            dnsRecordType: DnsRecordType.A,
            dnsTtl: Duration.seconds(1),
            name: 'service-' + suffix,
        });
        service.associateCloudMapService({
            service: cloudMapService,
        })

        service.connections.allowFromAnyIpv4(Port.allTraffic());
    }
}
