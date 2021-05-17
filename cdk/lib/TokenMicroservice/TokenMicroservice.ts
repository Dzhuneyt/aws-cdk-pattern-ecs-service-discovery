import {Construct, Duration} from "@aws-cdk/core";
import {
    ContainerImage,
    FargatePlatformVersion,
    FargateService,
    FargateTaskDefinition,
    ICluster,
    LogDriver,
    Protocol
} from "@aws-cdk/aws-ecs";
import * as path from "path";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {DnsRecordType, PrivateDnsNamespace} from "@aws-cdk/aws-servicediscovery";
import {Port} from "@aws-cdk/aws-ec2";

export class TokenMicroservice extends Construct {

    constructor(scope: Construct, id: string, private props: {
        cluster: ICluster,
        cloudMapNamespace: PrivateDnsNamespace,
    }) {
        super(scope, id);

        const taskDefinition = new FargateTaskDefinition(this, 'FargateTaskDefinition', {
            memoryLimitMiB: 512,
            cpu: 256,
        });
        taskDefinition.addContainer("web", {
            // Use an image from DockerHub
            image: ContainerImage.fromAsset(path.resolve(__dirname, "./../../../microservices/token")),
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

        const service = new FargateService(this, 'FargateService', {
            cluster: props.cluster,
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

        const cloudMapService = props.cloudMapNamespace.createService('token', {
            dnsRecordType: DnsRecordType.A,
            dnsTtl: Duration.seconds(1),
            name: 'token',
        });
        service.associateCloudMapService({
            service: cloudMapService,
        })

        service.connections.allowFromAnyIpv4(Port.allTraffic());
    }
}
