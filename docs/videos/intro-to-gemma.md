0:15
[music]
0:29
[music]
0:45
[music] Dup.
0:50
[music]
1:04
Hello. Hi everyone. Hope you all are doing well. So
1:11
first of all, welcome to the session. Great to have you all here. So my name
1:16
is Shvi and I will be your host for the day. So before we begin, so just wanted
1:24
to thank everyone who has joined this session. So this is our hands-on workshop on introduction to Gemma part
1:31
of the build with AI workshop series 3. So today's session is going to be practical and hands-on so you can
1:39
actually start building with AI rather than just hearing about it. Moving
1:45
ahead, solution challenge 2026 India build with AI is an initiative by Google
1:51
in partnership with hacktoskll where student developers build solution for real world problems. The idea is simple.
1:59
Use Google technology and AI to create meaningful impact.
2:04
So today we'll quickly walk you through the overall hackathon, the timeline and
2:10
what to expect. Then we get into the hands-on building, explore the Gemma
2:15
model and help you pick up practical skills you can apply to your own project.
2:21
So first uh first of all just there's 7 days left before the deadline closed on
2:27
28th April 2026. Just don't wait till everything is
2:32
perfect. Get your first draft in with the core idea that what matters right
2:38
now and you can keep improving it and update your submission with better features before the deadline closes. So
2:45
you can make any number of submissions before the deadline uh before the deadline. So I recommend you all to just
2:52
submit the draft and with the core idea. Moving ahead for the timeline. So
2:58
currently we are at the registration team formation as well as the prototype
3:04
submission phase which will end on 28th April 2026. Then the prototype
3:10
evaluation phase will begin from 29th April which will go on till 28th of May
3:16
2026. Then there will be induction session on 1st June 2026.
3:22
Then we will have our top 100 team announcement on 29th May 2026. Then top
3:29
10 finalist announcement will be on 20th June 2026. And then the D-day the grand finale
3:36
which will be in online the virtual one. It will be held on the last week of June. Okay. Now for the questions. So
3:46
how you can uh ask your questions. So as you can see on my screen there is a QR
3:52
code which you need to scan. Then you need to enter your name. So we can keep
3:57
it a bit personal and type your questions clearly and concisely over there. Once the session will end we'll
4:04
take up the questions. We'll pick up the questions from there. So just scan this QR code or what you can do there will be
4:11
an option for the slido code. Just type over there solution challenge.
4:17
Now for the problem statements. So we have five problem statements with us. So
4:23
the five problem statements are digital asset protection, rapid crisis response, smart supply chains, unbiased AI
4:31
recision and smart resource allocation. Under these each theme includes an open
4:36
innovation category as well enabling participants to propose solution for
4:42
broader real world challenges under the given theme. Now they we have also sent you a
4:48
stepbystep uh six-step guide as well for your prototype like from idea to
4:54
prototype. This guide is very uh beginner friendly has practical prompts even if you're starting today after this
5:02
session then also you can build something and get it submitted. So just scan this QR code and then you'll land
5:08
it on our guide sixstep guide as well. Now for the price pool. Now this is the
5:15
most interesting part. So the total cash price worth is rupes 10 lakh. So the
5:20
winners will be getting four lak rupees. First runner up is rups 3 lakh. Second runner up is 2 lakh. Now we also have
5:28
two special categories. Special category one as well as special category 2 each worth rups 50,000.
5:35
Now moving ahead what you all need to submit like for the prototype
5:41
submission. So first is the problem statement. The problem statement here
5:46
means like it should clearly defines the issue your team is addressing. Okay. Now
5:53
the solution overview which means explain how your prototype your particular solution solves the problem
5:59
which your team is addressing. Then a live MVP link demonstrating core functionality. A concise deck detailing
6:07
your solution architecture and impact. then GitHub repository public link to
6:13
the source code and then demo video a short video showcasing your solution and
6:18
its functionality. Moving ahead, we also have the prototype submission evaluation
6:24
criteria. So your prototype will basically be evaluated on our four main areas which
6:31
are technical merit, user experience, alignment with cause, innovation and
6:36
creativity. So technical merit consist of 40% like how well and creatively you
6:43
used Google technology with scalable and maintainable code. Then user experience
6:49
consist of 10% how userfriendly your solution or the prototype is. Then
6:54
alignment with the cause does it address a real social challenge and create a meaningful impact. This consists of 25%
7:02
and innovation and creativity. So whatever solution you have built does it
7:08
really bring a fresh idea and improve existing processes. So for if you want a
7:13
more detailed breakdown of the evaluation criteria you can also check the official website. Now the most
7:20
awaited part. So let me introduce today's speaker Rishi Raj Achara. He is
7:26
a Google developer expert in Kaggle, GCP and machine learning with with strong
7:31
experiences geni, tensorflow and hugging face. So he currently works as an Emily
7:37
at Intly Tech and will be helping you build hands-on solution and guide you in
7:43
creating your own AI prototype during this today's session. So let's welcome
7:49
him. Hi Rishi, how are you? Hey. Hi. uh uh nice to meet all the
7:55
participants uh present in this uh uh chat. Uh without wasting a lot of time
8:02
uh speaking about myself since uh Sh uh Shvi has already introduced uh and said
8:09
a bit about me uh we can jump to sharing the slides.
8:24
Perfect. So, uh, welcome everyone. Uh, like, uh, just a minute.
8:46
Uh, yeah. All right. So,
8:52
uh, so today we are going to talk about something that, uh, just a few years ago sounded, uh, like, uh, pure science
8:58
fiction. And, uh, we are going to look, uh, at, uh, how to run a frontier level
9:04
cutting edge AI model, uh, entirely on your own laptop or maybe even your
9:09
phone, right? So, I'm talking about, uh, Gemma 4. Uh this is a brand new family
9:15
of open models from uh Google deep mind and uh whether you are building your
9:20
first web app hacking at uh a weekend hackathon maybe or even uh doing AI
9:27
research JMA 4 will be an incredibly useful tool for you. So let's uh dive
9:33
in. But uh can you get the next slides? Yeah.
9:39
So uh so as a student developer like uh you
9:45
will uh face a big challenge while uh building AI projects and uh the most
9:51
powerful uh AI models like maybe Gemini uh or any other frontier level uh models
9:58
that you'll be using are usually locked behind APIs, right? Uh and they are generally paid. uh they require like a
10:06
constant internet connection. they cost uh money every single time you prompt
10:12
them uh maybe through the GCP console uh your your cloud billing account and uh
10:20
you can't guarantee data privacy right but the open source community is
10:25
changing that uh Google released this uh open family of models uh called Gemma
10:33
and now we have Gemma 4 which is the latest uh uh release in that family.
10:40
It is uh completely uh an open-source model with Apache 2.0 license. So like
10:46
it is really open without any tricky clause like uh you have to pay after
10:52
this much limit or like that. So it's entirely free to use. Uh so that means
10:57
you can download it, tinker with it, build real apps without ever having to pay uh for API calls or even needing any
11:06
Wi-Fi connection as such. Right. Next slide, please.
11:12
Yeah. All right. So, Gemma 4, just to give you an idea, isn't just one model.
11:19
Uh, it is a family of four models designed to fit uh in every section of
11:25
uh the hardware that you might be using. So, uh let's say you have built a
11:33
solution that runs on your phones and old laptops, right? So for that you have
11:38
this E2B and E4B uh models. What does the E means? E means effective. So
11:44
effectively it is using two billion parameters. Uh E4B is uh effectively
11:51
using 4 billion parameters and these are uh great enough to run on even
11:56
smartphones and uh modern day uh or even old day uh CPUs if you have that. And if
12:03
you have a gaming laptop or maybe a newer Mac with this M series chip, uh
12:09
the 26B A4B is really pure magic. It's a mixture of expert. Uh for those uh who
12:17
don't know what an mixture of expert is. Think of it like a group of uh project,
12:22
right? The model has a total of 26 billion parameters of knowledge. But uh
12:28
like for any given uh question it only wakes up uh around 4 billion parameters
12:34
to do the work right. Uh yeah so it gives you a massive brain
12:39
power but uh at the same time runs very fast since actively 4 billion parameters
12:46
is being used. And finally at the sitting at the throne is this 31 billion
12:51
parameter model uh which is great for the heaviest kind of workload right but
12:58
according to my experience you won't be ever needing this 31 billion parameter
13:03
model on the projects that you will be developing this E2B and E4B models uh
13:09
would be more than enough and uh next slide please and the best
13:14
part uh this E4B and E2B comes with
13:20
native audio processing capabilities as well. Right? So, uh what makes this JMA
13:28
4 family truly special is that this isn't just a like a text chatbot. Uh it
13:35
also has uh capabilities to see and hear stuff. Uh you can maybe feed it an
13:41
image, a video, a audio recording and ask questions about it. Right? So for
13:46
vision like it uh resizes the image meaning like it does not just crush your
13:53
image into a bloody square to read it. So uh yeah I think the coolest part with
14:01
these uh four family of models is that the just the smaller models like E2B and E4B comes with native audio
14:08
understanding. So if you are working with application that deals with handling audio, the smaller models would
14:16
not just be enough. It would be uh even more capable to understand audio than
14:21
the uh bigger two models, right? You can literally record yourself speaking, pass
14:26
the MP3 to the model and it understands your speech directly.
14:31
Generally what you used to do do previously was uh use a speechtoext
14:37
model differently uh other than this Gemma model convert that speech to raw
14:43
text and then uh uh give it to Gemma or any other open source model but uh now
14:49
you can do it natively right so yeah uh next slide
14:55
yeah so many of you might be wondering how does a multi-billion parameter model
15:01
fit into this limited RAM uh of maybe your cell phone or your low powered even
15:08
laptops uh with just CPU support right so the trick is this Google introduced
15:15
uh a small trick uh with the small models called per layer embeddings right
15:22
so what what you do so normally what an AI does has is that it has to load the
15:30
entire message dictionary of word uh to the RAM at once uh right when it starts.
15:38
But with this new trick, Gemma stores the heavy uh detailed dictionary on your
15:43
computer's hard drive and when you ask it a question, it quickly grabs only the
15:48
specific cheat sheet it needs for those uh specific words and moves it to the
15:53
RAM. So in this way it saves uh a massive amount of memory and as well
16:00
making it very efficient for the hardware you guys are using right now.
16:06
So essentially the entire thing is not loaded at once only when you need the
16:12
specific uh part uh that part is loaded into the memory.
16:17
All right. Uh next slide please. Now the best part about uh uh the open
16:23
source community around GMA is that you can run it really anywhere. If you are
16:28
using it in your coding project where you have coded in Python, you can just simply use the hugging face transformers
16:34
library to run it. Uh the hugging face uh community is really uh great at
16:41
helping you with uh friendly stuff over there. You can ask questions to the HF
16:46
community also. The model is available in Kaggle. If you want to use the Kaggle
16:52
API instead of hugging face, that's also there. If you are using a Apple series M
16:58
series chip, uh you can just use Apple MLX systems. Uh they are incredibly
17:03
optimized uh for running these models. If you're using Windows, maybe you can
17:09
uh start lama.cpp uh local inference. uh
17:15
just use uh you can download llama.cpb you can do a bit of research about on
17:20
the internet uh on how to run it and uh JMA has support for that as well and in fact if you just want to serve it in a
17:28
web browser uh you can do that as well with transformer.js JS like you don't need
17:35
your users to download the model or you to download the model. Your web browser
17:41
itself would uh uh load the model as a JavaScript and once you load the site
17:47
you do not need to have your internet connection to the website anymore. Uh your model will run right. Yeah. Next
17:54
slide please. And getting started with GMA 4 isn't
18:00
really that difficult. uh these are all the lines of code you need to uh write.
18:06
So if you know just basic Python you can build a multimodel app today. Uh the
18:11
hugging face pipeline makes this uh incredibly simply simple to use. I would
18:17
say like we could load the pipeline uh with this pipeline command. Uh any to
18:23
any is the modality name. So it can take any input given output any to any uh we
18:32
can grab the E2B model the tiny model we have. Uh we can create a message where
18:38
we pass it an image of a temple in Thailand maybe and uh we can ask a
18:44
question which city is this check the weather. Uh yeah in this just few lines
18:51
uh the model will look at the image use the reasoning uh to identify the city as
18:56
Bangkok and uh prepare a function called to check the weather right there's a uh
19:03
yeah this is a like you would say this is a foundation of uh how an autonomous agent would work
19:11
because uh an agent basically identifies uh the functions to all based on the
19:18
intent, right? So, yeah, but uh I think uh can you go to the next
19:26
slide? Yeah, I think uh
19:32
that's a lot of talk for uh something that's uh related to a hackathon. I
19:38
think the best thing to do would be uh I would show you a demo uh where things
19:44
would be working live so that you can uh check how things are working and uh you
19:50
can take inspiration build uh from there or even uh use that application as well
19:56
to just uh uh build your own solutions right so yeah you can uh create
20:04
different type of uh demos you can create UI generation Like uh if you are
20:09
a web if you want to develop a web development assistant uh you can just
20:14
ask in natural language and uh describe the functionalities that
20:21
uh your user interface should have and uh Jimma would uh write the entire code
20:27
uh to uh build a UI like that. But the
20:32
best part as I said uh already is Jima 4 natively supports audio understanding.
20:39
So we will develop something around uh the audio understanding part right. So
20:45
let me try sharing my screen uh
20:50
if that's all right. Yeah.
21:23
Yep.
21:28
Yeah. So, uh this is the demo. Uh it is
21:34
hosted in a hugging face space. For those unaware of what an hugging kiss space is, uh it is an environment where
21:43
you can write uh your entire project as a demo um by using application uh called
21:52
uh gradio. Gradio helps you to develop uh user uh friendly applications where
21:59
maybe you are not a web developer. you do not know how to code up this uh uh
22:04
interfaces, you just write the Python functions and what Gradio does is uh uh
22:11
it develops this interfaces for you. So I use that uh to create an interface like this for our application. These are
22:18
the files you see I have one app.py, one requirements.txt
22:24
uh and basically nothing else in the app.py Pi if you check we are loading uh
22:31
our model ID which is GMA 4 E2B instruction tuned this is the model uh
22:37
that is designed for question answering task we load the model using uh hugging
22:42
face auto preprocessor and automodel for multimodel
22:47
and uh yeah we get an example image we
22:53
get an example audio and this is the entire uh function
22:59
uh in Python that takes the image and the audio path and this is a system
23:05
prompt we have. You are an expert AI uh auto insurance adjuster. Your task is to
23:10
analyze uh the provided image of vehicle damage and audio statement from the
23:16
driver cross reference the audio description with the visual evidence.
23:21
You must only output uh a valid JSON. do not uh include markdown formatting like
23:27
JSON and it should look something like this. This is the text uh system prompt and
23:37
here you have the image path. Here you also have the audio path and uh another
23:43
text uh prompt like analyze this insurance claim and output the JSON uh
23:48
report. Right. Yeah. And this is application of the
23:54
chat template. And uh we ask the model to generate the output of max new token
24:00
512. 500 new 512 new tokens maximum would be outputed by the model. We do
24:08
some JSON cleaning just in case uh there has been some formatting issues with the model's output and we display the
24:16
results. Right? By the way, this code is open source. So uh you can just visit
24:22
this URL huggingface.co/spaces/riad/jimma4
24:28
insurance and uh you can uh visit the entire code just in case you want to
24:34
integrate it in your application but uh we'll run it and uh uh make QC right. So
24:42
here is an example car damage image and an audio.
24:49
I have a driver statement web file. By the way, this web file is a fake web
24:55
file wherein I'm just saying uh I love coffee and stuff which is not related to the image, right? So an AI claim
25:04
adjuster should understand that these two audio statement and car image are uh
25:10
not consistent. So we'll click generate claim report.
25:36
Let's hope everything works fine on the live demo. Yeah, you get uh the JSON output. See,
25:43
there's a valid JSON response. Damage severity medium. Affected parts is the
25:48
rear bumper and the rear quarter panel. Uh driver statement summary. driver
25:54
reported feeling fresh, having good morning and enjoying a nice cup of coffee. Consistency check is mismatch
26:00
because obviously the audio and the uh image is not matching. Flagged for review true and the reason for flagging
26:08
is the visual evidence shows significant damage to the rear bumper and quarter panel which contradicts the driver's
26:15
statement about pleasant morning and coffee suggesting the damage occurred during an incident. Right? So once you
26:22
get a valid JSON response like this uh I hope you understand that uh you can
26:28
parse this JSON you can develop a beautiful UI around it and uh basically
26:33
this is going to be be an end toend project uh which you can uh uh with just
26:40
mere few refinements uh make a valid submission as well right so yeah uh
26:48
uh again the link is over here. For those who are following along, you can
26:53
uh uh check this also. I'll paste this link uh in the chat. By the way, uh my
27:01
screen sharing can be stopped now.
27:12
Yeah, perfect. Uh
27:18
I think the team will uh uh share the link to the space uh with you folks uh
27:24
so that uh you folks can follow along uh after this session as well. But uh we'll
27:30
move ahead with our rest of the slides. Yeah. Uh next slide please.
27:39
Yeah. So how you can use this to make an impact on your campus or win uh this
27:45
hackathon is like you can create things like accessibility apps because the E2B
27:52
runs on phones and uh understands audio and images natively. You can build apps for uh visually or hearing impaired
27:59
students like that uh processes data entirely privately without uh sending
28:04
sensitive data to the cloud. Also, you can develop apps like maybe offline AI
28:10
tutor. So, uh maybe Wi-Fi goes down in the library. Not an issue. Gemma has a
28:17
like a massive context window uh that reaches up to 256,000 tokens, right? So,
28:24
you can feed it entire PDF textbooks uh that you might have and uh uh quiz
28:30
students completely offline without internet. Also uh if you are developing
28:36
projects uh related to robotics uh for the hardware teams here you can uh uh
28:42
just attach a a webcam to a cheap Raspberry Pi maybe uh run the Gemma E2B
28:48
model and uh use its vision and tool calling uh to steer an autonomous uh uh
28:55
campus to robot trade. There are many applications like this that you can build with this uh small locally running
29:02
models. But yeah, next slide please. Just to summarize,
29:10
uh Gemma 4 isn't just like any another incremental model update that we have
29:15
been seeing with other model providers or even the previous versions. It is
29:22
like a toolbox that puts uh frontier AI uh directly into hands of student
29:28
developers and uh you now have access to vision, audio, deep reasoning and uh
29:33
massive context windows as well. All completely free. Uh and the best part
29:39
running absolutely on your own hardware without having to run for costly GPUs
29:44
and stuff. And your next step would be just to go to hugging face, search for
29:50
Gemma 4, download the E2B model or the E4B model for this hackathon and uh try
29:56
getting it to describe a photo maybe on your laptop, right? That would be the coolest thing to do next. And yeah,
30:04
thanks for having me. Uh if you have any questions, you can ask. Meanwhile, uh
30:09
this is my QR code. Uh uh if you want to connect with me for asking questions
30:14
later, you can do that.
30:20
Great. Thank you Risharat for the session. Now just few things I wanted to
30:25
highlight to our participants. Uh hope my screen is visible to everyone. Uh Risha is my screen visible.
30:32
Yeah, your screen is visible. Great. So now where you need to make the submission and all. So this is where uh
30:40
uh like your dashboard looks like. This is the road map. Currently uh we are at the team formation and the prototype
30:46
submission phase. Now first of all either you can go solo plus you can form
30:52
a team as well up to four members. So first to create a team you need to go to
30:57
the team management section. Yes you need to click on create a team.
31:03
You need to just enter all the details over here. Click on create. Then there
31:08
will be one option like either you can share the request over the mail or copy
31:14
the link and the other person has to accept that request. Now for the submissions here is the prototype
31:22
submission how it looks like you there are challenges you need to click on the challenges. So first five challenges are
31:29
the problem statement then on the basis of each problem statement there is an open innovation as well. If you're
31:35
choosing an open innovation related to that particular problem statement, you need to click over here. For example, I
31:42
have selected pro uh digital asset protection. Then you need to upload your
31:47
prototype deck or presentation. You need we have shared a template with you over here. From here you need to uh download
31:54
this template and just copy the exact template whatever has been shared with
31:59
you. Then you need to provide a brief overview of your solution and how it solves the problem.
32:07
Here you need to share your prototype demonstrating the core functionality link. Here you need to share a GitHub
32:14
repository link. Then you need to share a short demo video showcasing your uh
32:19
solution and its functionality. And have you deployed a solution on the cloud using Google cloud? If yes, click
32:26
on yes. If no, then no. and which Google AI model services you have used like
32:31
Gemini, Vortex AI, vision AI etc etc. Then once done you can click on submit.
32:38
Just one thing I want to highlight again that uh just submit your idea like a
32:44
basic draft you can submit and you can make any number of changes until the deadline. So till 28th you can make the
32:51
changes. So just submit your idea and we can move ahead. Now let's move to the
33:00
Q&A part. Just give me a moment. Yes.
33:06
So now it's time for FAQ. Just you can scan this QR code and or either you can
33:14
go to slido.com and put the slider code which is solution challenge and then we
33:20
can uh show you like then we can answer your queries. So I'll just uh put the
33:26
screen for 2 minutes and then we can start.
33:36
[snorts] I think we can go with the FAQs, right? Yeah, sure.
33:42
Okay, great. I just share that as well.
33:48
So is my screen visible? Yep. Yep. Okay. Uh it would be nice if you could
33:54
uh zoom in a bit. Uh the text is not visible. Okay. It's not visible. Just give me a
34:01
moment. Just zoom in a bit. Uh so that the text is okay. Just a moment. Just a moment. I'll
34:07
do that. I'll present it again. Just a minute.
34:30
Is it visible now? Yes, I think. Yeah, it's uh visible. Yeah, perfect.
34:36
Yeah. Okay. So, the first question is when we use a LM model like Gemma, it runs
34:43
locally on our system. But what about when we host it live and submit our project won't work if we turn off our
34:50
PC. Okay. Uh so for hosting if you are uh uh
34:56
going to host your project I would highly recommend using hugging face spaces like see uh the base Gemma models
35:05
like E2B E4B they are capable of running on CPU per se but uh to get uh decent
35:14
results uh you would ideally need to deploy on a GPU right uh if you want to
35:20
uh move with Google provided solutions then maybe uh deploying on a cloudr run
35:27
GPU or a dedicated GPU VM would uh be a
35:33
solution. But I would recommend if you are going to host a JMA model, try the
35:39
hugging face spaces thing since uh it will provide you with a zero GPU uh for
35:46
free. A zero GPU is something uh that will spawn up a a 100 GPU when you need
35:54
to do the inferencing or whoever is using the app uh the GPU will spawn up
36:01
at that time it will do your task and uh it'll shut down. So but that would be
36:06
the most economic uh solution for you to host HMAR model right I hope that answers the question.
36:13
So our next question is apart from the problem statement and domains given can I select a new domain under open
36:19
innovation when will be the final project product submission. So no you need to select the problem statements
36:26
which are mentioned in in the challenges section plus for the open uh innovation
36:32
works only if you select a particular say problem under that but which falls
36:37
under that particular theme. Apart from the theme you cannot change any uh solution like any problem statement and
36:45
for your next question I think you're asking about the deadline so it's 28th
36:50
of April wing 26 now next question is what is MVP link
36:57
and please can you tell how to deploy project easily okay uh so MVP basically is a minimum
37:05
viable uh product so basically uh a sample of your idea that can be tested
37:11
out or maybe it does not have to be end to end production grade minimum viable
37:17
product right so uh for deploying easily like as I uh shared the link uh uh uh
37:25
shi it would be really great if you can uh share this hugging face pieces uh
37:30
link with the participants so that uh they can have a look how to deploy in hugging face but uh otherwise uh uh if
37:38
If you if you want to go and visit other examples as well, there is this JMA
37:44
cookbook by published by Google. You can just uh have a Google search uh uh on
37:51
JMA cookbook. There will be a lot of examples you can see there. But for hosting, yeah, uh cloud run GPU or maybe
38:01
uh hugging face spaces uh would be a good option also.
38:09
In fact, uh no, if you want to if you want static inference, collab and kaggle
38:15
is there, but it would not serve for like long-term usage for all your
38:20
participants. So hosting in uh these GPU environments would be the easiest thing to go.
38:26
Okay. Uh next question is uh please can you tell the best AI tools for any app
38:33
making and which will which will be very useful to us.
38:38
AI tools as in uh I do not specifically understand uh what
38:44
AI tools you are uh specifying. uh like if you are willing to ask about
38:50
agent AI stuff in fact uh getting weather details using weatherly API and
38:58
such things uh would be counted as tools but to be honest I do not understand
39:05
what AI tools you are referring to so can't really answer
39:11
your query in the meanwhile we'll be taking another query so please can you tell how can I start my project because
39:17
till now I haven't started my project and this is a first hackathon in my fourth sim. So we have uh in the
39:24
meantime we have shared one QR code with you where there was a step a sixstep guide mentioning that how you can submit
39:32
your idea to the prototype. So if you want that if you want to access to that guide you can mail us at solution
39:38
channel support at the ratehackerskll.com and we'll be sharing a guide with you so you can have a look
39:44
about it. Next is uh I want to build uh many more
39:52
projects then how can I start from now onward so that I can upgrade my CV. I think that's the same question we'll be
39:58
sharing the guide. If you have any recommendation for them Rish you can of course give them. Yeah like uh do not work on uh building
40:08
more projects as such which are pet projects. build something which is impactful and you can uh show for a long
40:15
term on your CV, right? Uh like I have been working in the industry for uh
40:20
quite some time now and even in my resume I have uh links to get uh this
40:26
hugging face pieces uh where I've hosted some cool demos. So uh if you are really
40:34
planning on creating an impactful CV, don't just copy paste projects uh that
40:40
are that are already available on the internet. Think of something innovative that might be simple as well. No one
40:46
expects you to build another uh open AI or uh another Facebook kind of complex
40:52
stuff. Build something simple but uh make that impactful and uh make it
40:57
unique. Okay. Uh next question is should we focus more on advanced a IML models or
41:04
on building a reliable scalable system with intelligent logic?
41:10
My tip uh would be to uh focus on the second part like uh I can stuff in a
41:18
bunch of AI uh uh crap uh into a project. A project can do 100 stuff
41:23
using AI call 100 tools uh use MCP and
41:29
whatn not and at the end when user tries using it it runs into errors it runs
41:36
into bugs. uh that's not something very impactful you are creating because
41:42
like honestly if you just uh get the documentation of any AI model uh like
41:48
this Gemma and such stuff uh give it to Gemini and ask it to create an app
41:55
[clears throat] that will use the maximum amount of capabilities it will give you a complex project but what
42:02
happens is uh it will break in production so build something that and scale in future. Although you may not
42:10
need to create a fully production grade system now because uh you need to submit an MVP but it should be ideally scalable
42:18
and reasonable in the future. Okay. So next question is ma'am if I
42:25
want to change my team name can I? Yes of course you can change your team name. Once you go to the team management
42:31
section, there is one option uh uh like to the right of your uh team name a
42:38
pencil option like from there you can edit your team name and your team name will be changed.
42:46
Now stuck on Google cloud billing for publishing my prototype build using
42:51
Google AI studio. Do we get credits to publish on Google cloud or should I use render?
42:59
So for that's for you to answer. Yes. Yes. Yes. So uh uh just for the
43:06
credits thing once you go to the resources section we have shared a
43:11
process to redeem cloud credits. So Google cloud like offers $300 free
43:17
credits. So you can redeem those credits. We have shared a step-by-step guide with you over the resources
43:23
section. You can go and uh refer to that guide as well. [snorts] Uh then the next question is can't
43:30
understand how to integrate Gemma 4 in our project. Is there any package or lines of code we need to copy or paste?
43:39
Uh that's a interesting question. Lines of code you need to copy and paste. It
43:46
sounds very wrong but yeah you can visit the space link. You can see the files.
43:53
Uh click the files tab. you can get a understanding of the code and syntaxes
43:59
how that code uh runs. You can customize that thing. Uh just do
44:06
not copy paste uh the thing like you have mentioned. Uh that would set a bad
44:12
example. Uh but uh in general try understanding how those lines of code
44:17
are really working. Uh how they can be utilized for your own project. uh
44:22
understand the syntax and then you can use that. Uh
44:28
okay. Uh so next question is is Gemma different from other AI models?
44:35
Gemma if you are specifically asking for Gemma 4 it is the topofthe-line opensource model currently. Uh if you
44:45
consider do not consider like the Quinn u 3.6 six which was released later but
44:50
uh apart from that it is uh giving the flagship level performance uh across a
44:56
lot of benchmarks and also it is mult natively
45:02
understanding multimodel data as well which at least most of the open source
45:07
models that I know so far uh do not like maybe mistral or meta on the smaller
45:13
models audio understanding is not that great or natively supported So yeah uh
45:20
the thing with Gemma is that it is developed by Google using the same uh
45:25
training pipelines uh they used to train uh the FL their flagship models like Gemini. So the quality you get with
45:33
these models are uh really good also it is as I said uh Apache 2.0
45:39
license. So it is in true sense uh open source unlike the other models which
45:46
comes with restrictive licenses like meta you cannot scale it uh to multiple
45:52
users because at after some point there are usage catches over there.
45:58
Yeah. Next question is ma'am can you tell me more about open innovation? What can we do in open innovation? So
46:04
basically open innovation means there are five problem statement uh we have uh
46:10
given to you for this uh solution challenge and then for each problem statement there is an open innovation.
46:16
So for example, if there is any problem statement and uh you
47:21
All right, I guess uh her internet connection has dropped. Uh we'll wait uh for a moment for her to join back so
47:30
that she can continue.
48:19
Meanwhile, if you have any other questions, uh you can connect uh really sorry there was some network issue from
48:25
my end. I'm really sorry for that. I'm really sorry everyone. Okay. I was saying about the open
48:31
innovation. So if you have some uh like you have selected one problem statement
48:36
and you don't want you thought of some other idea which is related to that
48:42
particular problem statement then that will be considered under open innovation. But if you go out of the box
48:49
and take some other problem statement then it will not be considered under open innovation. that problem statement
48:55
should be under that particular uh that uh problem statement which we have mentioned in the uh guide or like in the
49:02
challenges section. So is it mandatory to deploy on Google
49:07
cloud for selection to next round? Yes, we recommend that because uh to use
49:12
Google cloud or Google technologies for this particular hackathon we recommend that to everyone.
49:23
Okay, I think we have taken most of the questions. So if uh just let me share my
49:31
screen again. No.
49:42
Yes. So if uh some of the queries were unanswered or we have skipped some of
49:48
the queries, you can of course reach uh reach out to us on solution challenge support at the ratehackskll.com
49:54
and thank you so much Dishi for the session. It was really very insightful and I believe that our participant loved
50:02
the session. Thank you so much for your time and thank you everyone for joining in this today's session.
50:08
Thank you. Thank you. Bye-bye.