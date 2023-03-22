import * as cdk from "aws-cdk-lib"
import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import { StateMachineExecutionRole} from "./state-machine-access-role";
import { LegacyAppTable} from "./table-stack";
import {Options} from "../types/options";
import {LegacyAppSqsSnsConstruct} from "./legacy-app-sqs";
import {LegacyAppStateMachine} from "./legacy-app-state-machine";
import {ScheduleRole} from "./eventbridge-schedule-role";
import {EventBridgeSchedule} from "./eventbridge-schedule";

interface LegacyStackProps extends StackProps {
  options: Options,
}

export class LegacyAppStack extends Stack {
  constructor(scope: Construct, id: string, props: LegacyStackProps) {
    super(scope, id, props);

    //Create Queue
    const snsSqsStack = new LegacyAppSqsSnsConstruct(this,"LegacyAppSnsSqsStack")

    // Create Employee DynamoDB table
    const tableStack = new LegacyAppTable(this, 'LegacyAppTableStack', {})

    // Create Role
    const stateMachineExecutionRole = new StateMachineExecutionRole(this,"LegacyAppStateMachineRoleStack" ,{
          options:props.options,
          table: tableStack.table,
          topic: snsSqsStack.topic,
        }
    )

    // Create State Machine
    const legacyAppStateMachine = new LegacyAppStateMachine(this, "LegacyAppStateMachineStack" , {
        options:props.options,
        table: tableStack.table,
        topic: snsSqsStack.topic,
        role:stateMachineExecutionRole
      }
    )

    //Export State Machine Arn
    new cdk.CfnOutput(this, 'LegacyAppStepFunction', {
      value: legacyAppStateMachine.stateMachine.attrArn,
      description: 'legacy-app-state-machine-arn',
      exportName: 'stepFunctionName',
    });

    // Create EventBridge Scheduler Role
    const scheduleRole = new ScheduleRole(this,"LegacyAppSchedulerRoleStack", {
          options:props.options,
          stateMachineArn: legacyAppStateMachine.stateMachine.attrArn
    });

    const eventBridgeSchedule = new EventBridgeSchedule(this,"LegacyAppEventBridgeScheduleStack",{
        options:props.options,
        stateMachineArn: legacyAppStateMachine.stateMachine.attrArn,
        schedulerRoleArn: scheduleRole.roleArn
    })


  }
}
