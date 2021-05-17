import * as cdk from '@aws-cdk/core';
import {Cluster} from "@aws-cdk/aws-ecs";
import {SubnetType, Vpc} from "@aws-cdk/aws-ec2";
import {PrivateDnsNamespace} from "@aws-cdk/aws-servicediscovery";
import {TokenMicroservice} from "./TokenMicroservice/TokenMicroservice";
import {AuthMicroservice} from "./AuthMicroservice/AuthMicroservice";
import {ApplicationLoadBalancer} from "@aws-cdk/aws-elasticloadbalancingv2";
import {CfnOutput} from "@aws-cdk/core";

export class EcsMicroserviceDiscoveryStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = this.getVpc()
        const cluster = this.getCluster(vpc);
        const cloudMapNamespace = this.getCloudMapNamespace(vpc)

        const tokenMicroservice = new TokenMicroservice(this, 'TokenMicroservice', {
            cluster,
            cloudMapNamespace,
        });

        const authMicroservice = new AuthMicroservice(this, 'AuthMicroservice', {
            cluster,
            cloudMapNamespace,
        });

        const applicationLoadBalancer = this.getLoadBalancer(vpc, authMicroservice);

        new CfnOutput(this, 'ALB-URL', {
            value: applicationLoadBalancer.loadBalancerDnsName,
        })
    }

    private getLoadBalancer(vpc: Vpc, authMicroservice: AuthMicroservice) {
        const lb = new ApplicationLoadBalancer(this, 'LB', {
            vpc,
            internetFacing: true
        });

        // Add a listener and open up the load balancer's security group to the world.
        const listener = lb.addListener('Listener', {port: 80});

        // Forward traffic from the Listener to the Auth microservice
        listener.addTargets('AuthTarget', {
            port: 80,
            targets: [authMicroservice.service]
        });
        return lb;
    }

    private getCloudMapNamespace(vpc: Vpc) {
        return new PrivateDnsNamespace(this, 'PrivateDnsNamespace', {
            name: 'myapp',
            vpc,
        });
    }

    private getCluster(vpc: Vpc) {
        return new Cluster(this, 'Cluster', {
            vpc,
            capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
        });
    }

    private getVpc() {
        return new Vpc(this, 'VPC', {
            cidr: '10.0.0.0/21',
            subnetConfiguration: [
                {
                    subnetType: SubnetType.PUBLIC,
                    name: "Ingress",
                    cidrMask: 24,
                }
            ]
        });
    }
}
