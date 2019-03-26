// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { ChoicePrompt, DialogSet, NumberPrompt, TextPrompt, WaterfallDialog,HeroCard,DialogTurnStatus} = require('botbuilder-dialogs');
const { ActivityTypes,CardFactory } = require('botbuilder');
const { MessageFactory } = require('botbuilder');
    
const IntroCard = require('./resources/IntroCard.json');

//properties
const WELCOMED_USER = 'welcomedUserProperty';
const DIALOG_STATE_PROPERTY = 'dialogState';
const USER_PROFILE_PROPERTY = 'user';
const EXIST_CUST_POLICY_DETAILS_PROPERTY="policy";
const USER_INTENTION_PROPERTY="user_intention";

//dialog set names
const GREETING="greeting";
const BEGIN_CONVERSATION="begin_conversation";
const NEED_INSURANCE="need_insurance";
const POLICY_CHANGE='policy_change';
const COVERAGE_QUESTIONS='coverage_questions';
const POLICY_CHANGE_RERUN="polic_change_rerun";

//prompt names
const NAME_PROMPT = 'name_prompt';
const PHONE_PROMPT = 'phone_prompt';
const EMAIL_PROMT='email_prompt';
const EXISTING_CUST_CONFIRMATION='existing_cust_conf';
const POLICY_TYPE="policy_type";
const POLICY_DURATION="policy_durtion";
const RANGE_OF_COVERAGE="range_of_coverage";
const CONFIRM_POLICY_DETAILS="confirm_policy_details";
const CONFIRM_SIGN_UP="confirm_sign_up";
const FINAL_SAYING="final_saying";
const BREAK_THE_ICE="break_the_ice";
const POLICY_CHANGE_TYPES="policy_change_types";
const CHANGE_COVERAGE="change_coverage";
const CHANGE_TIME="change_time";
const CHANGE_POLICYTYPE="change_policytype";
const OTHER_CHANGE="other_change";
const P_CHANGE_CONF="p_change_conf";
const KIND_OF_QUESTION="kind_of_question";
const REASON_OF_QUESTION="reason_of_question";
const MORE_OFFERS="more_questions";
const BYE="bye";

class MultiTurnBot {
    /**
     *
     * @param {ConversationState} conversationState A ConversationState object used to store the dialog state.
     * @param {UserState} userState A UserState object used to store values specific to the user.
     */
    constructor(conversationState, userState) {
        // Create a new state accessor property. See https://aka.ms/about-bot-state-accessors to learn more about bot state and state accessors.
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogState = conversationState.createProperty(DIALOG_STATE_PROPERTY);
        // this.conversationData = conversationState.createProperty(CONVERSATION_DATA_PROPERTY);
        this.userProfile = userState.createProperty(USER_PROFILE_PROPERTY);
        this.userIntention = userState.createProperty(USER_INTENTION_PROPERTY);
        this.ploicyDetails = this.userState.createProperty(EXIST_CUST_POLICY_DETAILS_PROPERTY);
        this.dialogs = new DialogSet(this.dialogState);
        this.welcomedUserProperty = this.userState.createProperty(WELCOMED_USER);
        // Add prompts that will be used by the main dialogs.
        this.dialogs.add(new TextPrompt(NAME_PROMPT,async (step)=>{
            if (step.recognized.succeeded) {
                if (step.recognized.value.length < 3) {
                    await step.context.sendActivity(`Your name should have minimun 3 chars`);
                    return false;
                } else {
                    return true;
                }
            }
            return false;
        }));
        this.dialogs.add(new NumberPrompt(PHONE_PROMPT,async (step)=>{
            if (step.recognized.succeeded) {
                if (step.recognized.value.length < 10) {
                    await step.context.sendActivity(`Your name should have 10 digits`);
                    return false;
                } else {
                    return true;
                }
            }
            return false;
        }));
        this.dialogs.add(new TextPrompt(EMAIL_PROMT,async (step)=>{
            var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            if (step.recognized.succeeded) {
                if (step.recognized.value.match(mailformat)) {
                    return true;
                } else {
                    await step.context.sendActivity('Your email is not correct. please try again!');
                    return false;
                }
            }
            return false;
        }));
        this.dialogs.add(new ChoicePrompt(EXISTING_CUST_CONFIRMATION));
        this.dialogs.add(new ChoicePrompt(POLICY_TYPE));
        this.dialogs.add(new ChoicePrompt(POLICY_DURATION));
        this.dialogs.add(new ChoicePrompt(RANGE_OF_COVERAGE));
        this.dialogs.add(new ChoicePrompt(CONFIRM_POLICY_DETAILS));
        this.dialogs.add(new ChoicePrompt(BREAK_THE_ICE));
        this.dialogs.add(new ChoicePrompt(CONFIRM_SIGN_UP));
        this.dialogs.add(new TextPrompt(FINAL_SAYING));
        this.dialogs.add(new ChoicePrompt(POLICY_CHANGE_TYPES));
        this.dialogs.add(new ChoicePrompt(CHANGE_COVERAGE));
        this.dialogs.add(new ChoicePrompt(CHANGE_TIME));
        this.dialogs.add(new ChoicePrompt(CHANGE_POLICYTYPE));
        this.dialogs.add(new ChoicePrompt(OTHER_CHANGE));
        this.dialogs.add(new ChoicePrompt(P_CHANGE_CONF));
        this.dialogs.add(new ChoicePrompt(KIND_OF_QUESTION));
        this.dialogs.add(new ChoicePrompt(REASON_OF_QUESTION));
        this.dialogs.add(new ChoicePrompt(MORE_OFFERS));
        this.dialogs.add(new ChoicePrompt(BYE));
        //break the ice
        this.dialogs.add(new WaterfallDialog(BEGIN_CONVERSATION, [
            this.promptForBeginConversation.bind(this),
            this.promptCaptureUserIntent.bind(this),
        ]));
        this.dialogs.add(new WaterfallDialog(GREETING, [
            this.sendWelcomeMessage.bind(this),
        ]));
        this.dialogs.add(new WaterfallDialog(NEED_INSURANCE,[
            this.promptForName.bind(this),
            this.promptForPhone.bind(this),
            this.promptForEmail.bind(this),
            this.promptForExistingCustConfirmation.bind(this),
            this.promptForPolicyType.bind(this),
            this.promptForPolicyDuration.bind(this),
            this.promptForPolicyRange.bind(this),
            this.promptForConfirmPolicyDetails.bind(this),
            this.promptForSignUpConfirmation.bind(this),
            this.FinalSaying.bind(this),
            ]));
        this.dialogs.add(new WaterfallDialog(POLICY_CHANGE,[
            this.promptForName.bind(this),
            this.promptForPhone.bind(this),
            this.promptForEmail.bind(this),
            this.promptForPolicyChangeTypes.bind(this),
            this.capturePolicyChangeTypeResponse.bind(this),
            this.otherChangesPrompt.bind(this),
            this.captureOtherChangesResponse.bind(this),
            ]));
        this.dialogs.add(new WaterfallDialog(POLICY_CHANGE_RERUN,[
            this.promptForPolicyChangeTypes.bind(this),
            this.capturePolicyChangeTypeResponse.bind(this),
            this.otherChangesPrompt.bind(this),
            this.captureOtherChangesResponse.bind(this),
            ]));
        
        this.dialogs.add(new WaterfallDialog(COVERAGE_QUESTIONS,[
            this.promptForName.bind(this),
            this.promptForPhone.bind(this),
            this.promptForEmail.bind(this),
            this.kindOfQuestion.bind(this),
            this.promptForReason.bind(this),
            this.promptForNewPlan.bind(this),
            this.finalBotSay.bind(this),
            this.catchUserFinalSay.bind(this),
            ]));
        } 
        ////////////////////////////////////////////////////////////////////////  
        async promptForBeginConversation(step){
           let messageWithCarouselOfCards = MessageFactory.carousel([
            CardFactory.heroCard(
                'Do you need Insurance?',
                CardFactory.images(['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmX0FxmbWh-cnd9OoP3-ZPXA1E9TkclhrGfdUbjQ_m4ZfHxiZM']),
                CardFactory.actions([
                    {
                        type: 'imBack',
                        title: 'Need Insurance',
                        value: 'Need Insurance'
                    }
                ]),
            ),
            CardFactory.heroCard(
                'Do you need to change policy?',
                CardFactory.images(['data:image/png;base64,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']),
                CardFactory.actions([
                    {
                        type: 'imBack',
                        title: 'Policy Change',
                        value: 'Policy Change'
                    }
                ]),
            ),
            CardFactory.heroCard(
                'Do you need to ask coverage related questions?',
                CardFactory.images(['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwwW6B8vJyJYFTCOlyGRXUVEIRJX9D8VC1KLpzetT0Oh0SeH0ltA']),
                CardFactory.actions([
                        {
                            type: 'imBack',
                            title: 'Coverage Questions',
                            value: 'Coverage Questions'
                        }
                    ]),
            ),
                ]); 
            return await step.context.sendActivity(messageWithCarouselOfCards);         
        }
        async promptCaptureUserIntent(step){
            const user_intention = await this.userIntention.get(step.context, {});
            user_intention.Intention=step.result;
            await this.userProfile.set(step.context,{});
            return await step.endDialog();
        }
        ////////////////////////////////////////////////////////////////////////  
        async kindOfQuestion(step){
            try{
                const user = await this.userProfile.get(step.context, {});
                user.Email=step.result.value;
                await this.userProfile.set(step.context, policy);
                return await step.prompt(KIND_OF_QUESTION,{
                    prompt: MessageFactory.text("I see you are an existing customer, I can help you with your questions, you can say:"),
                    choices: ["How do I cancel my policy?","How do I find out the details of my policy","How do I make changes to my beneficiary?"],
                });
            }
            catch{
                return await step.prompt(KIND_OF_QUESTION,{
                    prompt: MessageFactory.text("I see you are an existing customer, I can help you with your questions, you can say:"),
                    choices: ["How do I cancel my policy?","How do I find out the details of my policy","How do I make changes to my beneficiary?"],
                });
            }        
        }
        async promptForReason(step){
            const policy = await this.ploicyDetails.get(step.context, {});
            policy.coveragQuestion=step.result.value;
            await this.ploicyDetails.set(step.context, policy);
            return await step.prompt(REASON_OF_QUESTION,{
                prompt: MessageFactory.text("I can help you with that, may I know why you are cancelling your policy?"),
                choices: ["It’s too expensive","I don’t need it anymore","Other reason"],
            });
        }
        async promptForNewPlan(step){
            const policy = await this.ploicyDetails.get(step.context, {});
            policy.quesReason=step.result.value;
            await this.ploicyDetails.set(step.context, policy);
            return await step.prompt(MORE_OFFERS,{
                prompt: MessageFactory.text("There is a 10% discount on a new policy Click 2 Protect Health 3D, with lower premiums, would you like to switch to the new plan?"),
                choices: ["Yes, I’d like to know more","No, I’d like to cancel"],
            });
        }
        async finalBotSay(step){
            const policy = await this.ploicyDetails.get(step.context, {});
            policy.offerChoice=step.result.value;
            await this.ploicyDetails.set(step.context, policy);
            if(step.result.value==="Yes, I’d like to know more"){
            await step.context.sendActivity('Check our site to see the complete detials');
            await step.context.sendActivity('please type "help" to know more');
            return step.endDialog();
            }else{
                return await step.prompt(BYE,{
                    prompt: MessageFactory.text("Ok, your policy is cancelled. Your policy coverage will last till the end of this month, anything else I can assist you with?"),
                    choices: ["Yes","No"],
                });
            }
        }
        async catchUserFinalSay(step){
            if(step.result.value==='Yes'){
                await step.context.sendActivity("Please type 'help' to see what i can help you with");
                return await step.endDialog();
            }else{
                await step.context.sendActivity("Good Bye! We will be glad to serve you again in future.");
                return await step.endDialog();
            }
        }
        ////////////////////////////////////////////////////////////////////////  
        async promptForPolicyChangeTypes(step){
            try{
                const user = await this.userProfile.get(step.context, {});
                user.Email=step.result.value;
                await this.userProfile.set(step.context, policy);
                return await step.prompt(POLICY_CHANGE_TYPES,{
                    prompt: MessageFactory.text("What changes you would like to make to your policy"),
                    choices: ["coverage amount","coverage time","policy type"],
                });
            }
            catch{
                return await step.prompt(POLICY_CHANGE_TYPES,{
                    prompt: MessageFactory.text("What changes you would like to make to your policy"),
                    choices: ["coverage amount","coverage time","policy type"],
                });
            }          
        }
        async capturePolicyChangeTypeResponse(step){
            const policy = await this.ploicyDetails.get(step.context, {});
            policy.changeType= await step.result.value;
            var va1=step.result.value.toLowerCase();
            await this.ploicyDetails.set(step.context, policy);
            if(va1==='coverage amount'){
                return await step.prompt(CHANGE_COVERAGE,{
                    prompt: MessageFactory.text("I can help make changes to your policy, please select the new coverage amount:"),
                    choices: ["<10 lacs","10-20 lacs","20-30 lacs"],
                });
            }else if(va1==='coverage time'){
                return await step.prompt(CHANGE_TIME,{
                    prompt: MessageFactory.text("What duration do you want the coverage for:"),
                    choices: ["3 months","6 months","1 year"],
                });
            }else if(va1==='policy type'){
                return await step.prompt(CHANGE_POLICYTYPE,{
                    prompt: MessageFactory.text("What duration do you want the coverage for:"),
                    choices: ["Permament Policy","Term Policy"],
                });
            }
            // step.context.sendActivity(step.result.value);
        }
        async otherChangesPrompt(step){
            const policy = await this.ploicyDetails.get(step.context, {});
                if(policy.changeType.toLowerCase()==='coverage amount'){
                    policy.changedCoverageAmount=step.result;
                    await this.ploicyDetails.set(step.context, policy);
                    step.context.sendActivity(`Your coverage amount has been changed to ${step.result.value}.`);
                }else if(policy.changeType.toLowerCase()==='coverage time'){
                    policy.changedCoverageAmount=step.result;
                    await this.ploicyDetails.set(step.context, policy);
                    step.context.sendActivity(`Your coverage time has been changed to ${step.result.value}.`);
                }else if(policy.changeType.toLowerCase()==='policy type'){
                    policy.changedCoverageAmount=step.result;
                    await this.ploicyDetails.set(step.context, policy);
                    step.context.sendActivity(`Your policy type has been changed to ${step.result.value}.`);
                }
            return await step.prompt(OTHER_CHANGE,{
                prompt: MessageFactory.text("Any other changes you’d like to make your policy?"),
                choices: ["yes","no"],
            });
        }
        async captureOtherChangesResponse(step){
            if(step.result.value==="yes"){
                // await step.cancelAllDialogs();
                return await step.beginDialog(POLICY_CHANGE_RERUN);
            }
            else{
                return step.context.sendActivity(`Your changes has been saved. For any other query, please type "help"`);
                //return await step.endDialog(`Your changes has been saved. For any other query, please type "help"`);
                } 
        }
        ////////////////////////////////////////////////////////////////////////  
        async promptForName(step){
            return await step.prompt(NAME_PROMPT, {
                prompt:`I can assist you with that, what is your name?`,
                retryPrompt: `Please try again`,
            });
        }
        async promptForPhone(step) {
            const user = await this.userProfile.get(step.context, {});
            user.Name=step.result.value;
            await this.userProfile.set(step.context, user);
            return await step.prompt(PHONE_PROMPT,{
                prompt: `What is your phone number in case we get disconnected?`,
                retryPrompt: 'Please enter correct phone number with 10 digits'
            });
        }
        async promptForEmail(step) {
            const user = await this.userProfile.get(step.context, {});
            user.ContactNumber=step.result.value;
            await this.userProfile.set(step.context, user);
            return await step.prompt(EMAIL_PROMT, `What is your email address?`);
        }
        async promptForExistingCustConfirmation(step) {
            const user = await this.userProfile.get(step.context, {});
            user.Email = step.result.value;
            await this.userProfile.set(step.context, user);
            await step.prompt(EXISTING_CUST_CONFIRMATION, 'I can see you are an existing customer, are you looking to renew your policy?', ['yes', 'no']);
        }
        async promptForPolicyType(step) {
            if (step.result && step.result.value === 'yes') {
                return await step.prompt(POLICY_TYPE, {
                    prompt: 'I can help you with a new policy are you looking for a:',
                    retryPrompt: 'Sorry, Please choose one of the avilable options to confirm and proceed',
                    choices: ['Term Policy', 'Permanent Policy'],
                });
            } else {
                return await step.prompt(POLICY_TYPE, {
                    prompt: 'Oops! I am not trained to take this conversation ahead. You can choose "HELP" to see what i can help you with or choose "CANCEL" to abort',
                    choices: ['Help', 'Cancel'],
                });
        }}
        async promptForPolicyDuration(step){
            const policy = await this.ploicyDetails.get(step.context, {});
            policy.type=step.result.value;
            await this.ploicyDetails.set(step.context, policy);
            return await step.prompt(POLICY_DURATION, {
                prompt: 'What duration do want the coverage for:',
                retryPrompt: 'Sorry, Please choose one of the avilable options to confirm and proceed',
                choices: ['3 months', '6 months','12 months'],
            });
        }
        async promptForPolicyRange(step){
            const policy = await this.ploicyDetails.get(step.context,    {});
            policy.duration=step.result.value;
            await this.ploicyDetails.set(step.context, policy);
            return await step.prompt(RANGE_OF_COVERAGE, {
                prompt: 'Please select a range of coverage you would want?',
                retryPrompt: 'Sorry, Please choose one of the avilable options to confirm and proceed',
                choices: ['<10 lacs', '10-20 lacs','20-30 lacs'],
            });
        }
        async promptForConfirmPolicyDetails(step){
            const policy = await this.ploicyDetails.get(step.context, {});
            policy.coverage=step.result.value;
            await this.ploicyDetails.set(step.context, policy);
            return await step.prompt(CONFIRM_POLICY_DETAILS, {
                prompt: `You want a ${policy.type} , providing coverage of ${policy.coverage} for ${policy.duration}, correct?`,
                choices: ['yes', 'no'],
            });
        }
        async promptForSignUpConfirmation(step){
            if (step.result && step.result.value === 'yes'){
                return await step.prompt(CONFIRM_SIGN_UP, {
                    prompt: `You qualify for the Click 2 Health Protect Plan at Rs1000/month, if you sign up for it now, you’ll get a 5% discount, would you like to sign up for it?`,
                    choices: ['yes', 'no'],
                });
            }
            else{
                step.cancelAllDialogs();
                return await step.context.sendActivity('Oh! Please start over by typing "Help".');
            }
        }
        async FinalSaying(step){
            const user = await this.userProfile.get(step.context,{});   
            if(step.result && step.result.value === 'yes'){
                await step.context.sendActivity(`I will send over the information to your email address ${user.Email} and an agent will be in touch with you shortly`);
                return await step.endDialog();
            }         
            else{
                await step.context.sendActivity(`no problem. I will send over the informaton to your email address ${user.Email}, and an agent will get in touch with you shortly. `)
                return await step.endDialog();
            }
           
        }
        ////////////////////////////////////////////////////////////////////////  
        async sendWelcomeMessage(step) {
            if (step.context.activity.membersAdded.length !== 0) {
                for (let idx in step.context.activity.membersAdded) {
                    if (step.context.activity.membersAdded[idx].id !== step.context.activity.recipient.id) {
                        await step.context.sendActivity({
                            text: "Welcome to the 'Company Name' website. This is Lucy here to help you!",
                            attachments: [CardFactory.adaptiveCard(IntroCard)]
                        }); 
                    }
                }
            }
            return step.endDialog();
        }
        ////////////////////////////////////////////////////////////////////////  
    /**
     *
     * @param {TurnContext} turnContext A TurnContext object that will be interpreted and acted upon by the bot.
     */

    async onTurn(turnContext) {
        const dc = await this.dialogs.createContext(turnContext);
        const userD= await this.userProfile.get(turnContext, {});
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        if (turnContext.activity.type === ActivityTypes.Message) {
            var userVal;
            // Create a dialog context object.
            const utterance = (turnContext.activity.text || '').trim().toLowerCase();
            if (utterance === 'cancel') {
                if (dc.activeDialog) {
                    await dc.cancelAllDialogs();
                    await dc.context.sendActivity(`Okay... Cancelled.`);
                } else {
                    await dc.context.sendActivity(`Okay.. Cancelled`);
                }
            }
            if (utterance === 'help') {
                await dc.cancelAllDialogs();
                // await dc.beginDialog(BEGIN_CONVERSATION);
                var msg= MessageFactory.suggestedActions(["Need Insurance","Policy Change","Coverage Questions"],"I can help you with the following options");
                await turnContext.sendActivity(msg);
            }
            if (utterance == 'ok'|| utterance == 'okay'|| utterance == 'fine'|| utterance == 'thanks' || utterance == 'ok, thanks'|| utterance == 'thank you'|| utterance == 'ok, bye'|| utterance == 'bye' || utterance == "cool" || utterance =="kool") {
                await turnContext.sendActivity('Glad that i could help you. Have  a good day, bye!');
            }
            // If the bot has not yet responded, continue processing the current dialog.
            await dc.continueDialog();
            // Start the sample dialog in response to any other input.
           if (!turnContext.responded) {
                const user_intention = await this.userIntention.get(dc.context, {});
                userVal=user_intention.Intention.toLowerCase();
                if(utterance==='need insurance'|| utterance==='policy change'|| utterance==='coverage questions'){
                    userVal=utterance;
                }
                switch(userVal){
                    case 'need insurance':
                        await dc.beginDialog(NEED_INSURANCE);
                        break;
                    case 'policy change':
                        await dc.beginDialog(POLICY_CHANGE);
                        break;
                    case 'coverage questions':
                        await dc.beginDialog(COVERAGE_QUESTIONS);
                        break;
                    default:
                        await dc.endActiveDialog();
                        turnContext.sendActivity('Unrecognized input! Please type "Help" to seek my help.');
                }
            }
    }
        else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
            // if(userD.Name!=''||userD.Name!=null){
            //     turnContext.sendActivity(`welcome back dude ${userD.Name}`);
            // }
                await dc.beginDialog(GREETING);
                await dc.beginDialog(BEGIN_CONVERSATION);
        }
        await this.userState.saveChanges(turnContext);
        await this.conversationState.saveChanges(turnContext);
    }   
}

module.exports.MultiTurnBot = MultiTurnBot;
