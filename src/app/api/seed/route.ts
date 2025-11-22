import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Resource from '@/models/Resource';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Find or Create a Dummy Admin User for uploading
        let admin = await User.findOne({ email: 'admin@camp.com' });
        if (!admin) {
            // Try to find ANY user
            admin = await User.findOne({});
        }
        
        if (!admin) {
            // Create a dummy user if none exists
            admin = await User.create({
                name: 'Admin User',
                email: 'admin@camp.com',
                firebaseUid: 'dummy_admin_uid_' + Date.now(),
                role: 'admin',
                branch: 'CSE',
                year: 4
            });
            console.log('Created dummy admin user');
        }

        const uploaderId = admin._id;

        // 2. Define the Data Structure
        const subjects = [
            // 1st Year Subjects (Updated)
            {
                year: 1,
                branch: 'Common',
                code: 'BCHY101L',
                name: 'Engineering Chemistry',
                modules: ['Water Technology', 'Electrochemistry', 'Corrosion', 'Fuels and Combustion', 'Polymers']
            },
            {
                year: 1,
                branch: 'Common',
                code: 'BECE102L',
                name: 'Digital Systems',
                modules: ['Number Systems', 'Boolean Algebra', 'Combinational Circuits', 'Sequential Circuits', 'Logic Families']
            },
             {
                year: 1,
                branch: 'Common',
                code: 'BECE201L',
                name: 'Electronic Devices',
                modules: ['Semiconductor Physics', 'PN Junction Diode', 'BJT', 'FET', 'Power Devices']
            },
             {
                year: 1,
                branch: 'Common',
                code: 'BECE203L',
                name: 'Circuit Theory',
                modules: ['Circuit Analysis', 'Network Theorems', 'Transient Analysis', 'AC Circuits', 'Two Port Networks']
            },
            {
                year: 1,
                branch: 'Common',
                code: 'BEEE102L',
                name: 'Basic Electrical and Electronics Engineering',
                modules: ['DC Circuits', 'AC Circuits', 'Transformers', 'Electrical Machines', 'Semiconductor Devices']
            },
            {
                year: 1,
                branch: 'Common',
                code: 'BENG101L',
                name: 'Technical English',
                modules: ['Vocabulary Building', 'Grammar', 'Reading Comprehension', 'Writing Skills', 'Listening Skills']
            },
            {
                year: 1,
                branch: 'Common',
                code: 'BMAT101L',
                name: 'Calculus',
                modules: ['Matrices', 'Differential Calculus', 'Functions of Several Variables', 'Integral Calculus', 'Multiple Integrals']
            },
            {
                year: 1,
                branch: 'Common',
                code: 'BMAT102L',
                name: 'Differential Equations and Transforms',
                modules: ['Ordinary Differential Equations', 'Laplace Transforms', 'Fourier Series', 'Fourier Transforms', 'Z-Transforms']
            },
            {
                year: 1,
                branch: 'Common',
                code: 'BPHY101L',
                name: 'Engineering Physics',
                modules: ['Quantum Physics', 'Electromagnetism', 'Optics', 'Laser and Fiber Optics', 'Material Science']
            },
            // 2nd Year
            { year: 2, branch: 'ECE', code: 'BECE206P', name: 'Analog Circuits Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'ECE', code: 'BECE206L', name: 'Analog Circuits', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'Common', code: 'BMAT201L', name: 'Complex variables and linear algebra', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'CSE', code: 'BCSE205L', name: 'Computer architecture and organization', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'CSE', code: 'BCSE204L', name: 'Design and analysis of algorithms', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'CSE', code: 'BCSE204P', name: 'Design and analysis of algorithms Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'Common', code: 'BMAT205L', name: 'Discrete Maths And Graph Theory', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'CSE', code: 'BCSE202P', name: 'Dsa Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'CSE', code: 'BCSE202L', name: 'Dsa', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'ECE', code: 'BECE102P', name: 'Dsd Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'ECE', code: 'BECE102L', name: 'Dsd', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'ECE', code: 'BECE205L', name: 'Lemt', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'Common', code: 'BENG2991', name: 'Foreign Language', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'CSE', code: 'BCSE206L', name: 'Foundations Of Data Science', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'Common', code: 'BCLE214L', name: 'Global Warming', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'CSE', code: 'BCSE2991', name: 'Java', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'CSE', code: 'BCSE209L', name: 'Machine Learning', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'Humanities', code: 'BHUM104L', name: 'Macro Economics', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'Management', code: 'BMGT101', name: 'Management And Principles Of Leadership', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'ECE', code: 'BECE204P', name: 'Mpmc Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'ECE', code: 'BECE204L', name: 'Mpmc', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'CSE', code: 'BCSE2992', name: 'OOPS', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'ECE', code: 'BECE210L', name: 'Optical Fiber Communication', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'ECE', code: 'BECE2991', name: 'Principles Of Communication Systems', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'Math', code: 'BMAT202P', name: 'Probability And Statistics Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'Math', code: 'BMAT202L', name: 'Probability And Statistics', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'ECE', code: 'BECE207L', name: 'Random Processes', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'ECE', code: 'BECE202L', name: 'Signals And Systems', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'Humanities', code: 'BHUM109L', name: 'Social Work And Sustainability', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'Humanities', code: 'BHUM107L', name: 'Sustainability And Society', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'Common', code: 'BENG2992', name: 'Technical Report Writing', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'Humanities', code: 'BHUM2991', name: 'Urban Community Development', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'Common', code: 'BCLE215L', name: 'Waste Management', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'Common', code: 'BCLE216L', name: 'Water Resource Management', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 2, branch: 'CSE', code: 'BCSE203E', name: 'Web Programming', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },

            // 3rd Year
            { year: 3, branch: 'CSE', code: 'BSTS301P', name: 'Advanced Competitive Coding', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE304P', name: 'Analog Communications Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE304L', name: 'Analog communications', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE305L', name: 'Antenna & microwave engineering', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE305P', name: 'Antenna & microwave engineering Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE306L', name: 'Artificial intelligence', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE428L', name: 'Autonomous Drones', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE355L', name: 'Aws for cloud computing', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE355L', name: 'AWS Solutions Architect', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE427L', name: 'Cognitive Robotics', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE307P', name: 'Compiler design lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE307L', name: 'Compiler design', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE401L', name: 'Computer Communications and Networks', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE308P', name: 'Computer networks lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE308L', name: 'Computer networks', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE3991', name: 'COMPUTER VISION', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE302L', name: 'Control systems', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE309L', name: 'Cryptography and Network Security', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE411L', name: 'Cryptography and Network Security', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE302L', name: 'Database systems', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE302P', name: 'Database systems Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE332L', name: 'DEEP LEARNING', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE316L', name: 'Design of smart cities', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE306L', name: 'Digital communication systems', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE306P', name: 'Digital communication systems Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE403L', name: 'Digital image processing', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE301P', name: 'Dsp Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE301L', name: 'Dsp', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE320E', name: 'Embedded C Programming', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE403E', name: 'Embedded Systems Design', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE305L', name: 'Embedded Systems', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE418L', name: 'Explainable AI', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE324L', name: 'Foundations Of Blockchain Technology', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE406E', name: 'Fpga Based System Design', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE313L', name: 'Fundamentals Of Fog Edge And Computing', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE416L', name: 'Game Programming', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE414L', name: 'High Performance Computing', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE415L', name: 'Human Computer Interaction', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE404L', name: 'Internet And Web Programming', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE401L', name: 'Internet Of Things', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE351E', name: 'Internet Of Things', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE417L', name: 'Machine Vision', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE424L', name: 'Ml For Robotics', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE409L', name: 'Natural Language Processing', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE303P', name: 'Operating Systems Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE303L', name: 'Operating Systems', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE422L', name: 'Robot Modeling And Simulation', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE425L', name: 'Robotic Perception', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE421L', name: 'Robotics: Kinematics', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE312L', name: 'Robotics and automation', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE409P', name: 'Sensor Technology Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE409E', name: 'Sensor Technology', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE420L', name: 'Sensors, Actuators And Signal Conditioning', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE420P', name: 'Sensors, Actuators And Signal Conditioning Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'EEE', code: 'BEE412L', name: 'Sensors And Actuators', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECM301P', name: 'Signal Processing Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECM301L', name: 'Signal Processing', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE301P', name: 'Software Engineering Lab', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE301L', name: 'Software Engineering', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE304L', name: 'Theory Of Computation', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE303L', name: 'Vlsi System Design', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'CSE', code: 'BCSE315L', name: 'Wearable Computing', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] },
            { year: 3, branch: 'ECE', code: 'BECE317L', name: 'Wireless and Mobile Communications', modules: ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'] }
        ];

        const resourcesToInsert = [];

        for (const sub of subjects) {
            const resourceDoc = {
                courseCode: sub.code,
                courseName: sub.name,
                year: sub.year,
                branch: sub.branch,
                uploaderId: uploaderId,
                
                syllabus: {
                    linkUrl: 'https://docs.google.com/document/d/placeholder-syllabus',
                    description: `Official syllabus for ${sub.code}`
                },
                
                modules: sub.modules.map((modName, index) => ({
                    moduleNumber: index + 1,
                    title: modName,
                    linkUrl: 'https://docs.google.com/document/d/placeholder-notes'
                })),
                
                pyqs: [],
                others: []
            };

            // Add PYQs
            const exams = ['CAT1', 'CAT2', 'FAT'];
            const years = ['2023', '2022'];
            
            exams.forEach(exam => {
                years.forEach(y => {
                    // @ts-expect-error - pyqs is defined in the schema but TS might not infer it correctly here due to partial object construction
                    resourceDoc.pyqs.push({
                        exam: exam,
                        year: y,
                        linkUrl: 'https://drive.google.com/file/d/placeholder-pyq'
                    });
                });
            });

            resourcesToInsert.push(resourceDoc);
        }

        // Clear existing resources
        try {
            await mongoose.connection.collection('resources').drop();
            console.log('Dropped resources collection');
        } catch (e) {
            console.log('Collection might not exist, skipping drop');
        }

        // Insert new
        await Resource.insertMany(resourcesToInsert);

        return NextResponse.json({ 
            message: 'Database seeded successfully', 
            count: resourcesToInsert.length,
            sample: resourcesToInsert[0]
        });

    } catch (error: any) {
        console.error('Seeding failed:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 200 });
    }
}
